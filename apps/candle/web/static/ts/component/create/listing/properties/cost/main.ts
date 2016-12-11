import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
// import Immutable = require('immutable')
// import {combineObj} from '../../../../../utils'
import intent from './intent'
import model from './model'
import view from './view'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, blankComponentUndefinedDOM} from '../../../../../utils'
import {PerformerSignupOptions, CostOptions, PurchaseTypeOptions, BlankComponent, CostTypeComboBox, PurchaseTypeComboBox, NumberInputComponent} from '../helpers'
import clone = require('clone')

const opts = CostOptions


function MinimumPurchaseComponent(sources, props$, component_id) {
  const shared$ = props$.publishReplay(1).refCount()
  const number_input = NumberInputComponent(sources, props$.map(x => x.data.toString()), 'Minimum purchase: Invalid number')
  const p_opts = PurchaseTypeOptions
  const options = [
    p_opts.DRINK,
    p_opts.ITEM,
    p_opts.DOLLARS
  ]
  const type_input = isolate(PurchaseTypeComboBox)(sources, options, props$.map(x => x.type))

  const vtree$ = combineObj({
    number: number_input.DOM,
    type: type_input.DOM
  }).map((components: any) => {
    const {number, type} = components
    return div('.row', [
      span('.item', [number]),
      span('.item', [type])
    ])
  })

  const output$ = combineObj({
    data: number_input.output$,
    type: type_input.output$
  }).map((info: any) => {
    const {data, type} = info
    return {
      data: {
        data: data.data,
        type
      },
      valid: data.valid,
      errors: data.errors
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}


function getComponents(performer_cost$, sources, inputs) {
  const shared$ = performer_cost$
    .map(x => {
      return clone(x)
    })
    .distinctUntilChanged((x, y) => x.type === y.type)
    .publishReplay(1).refCount()

  const type$ = shared$.pluck('type').publishReplay(1).refCount()

  const cover_input_component$ = shared$.map((performer_cost: any) => {
    switch (performer_cost.type) {
      case opts.COVER:
      case opts.COVER_OR_MINIMUM_PURCHASE:
      case opts.COVER_AND_MINIMUM_PURCHASE:
        return NumberInputComponent(sources, O.of(performer_cost.data.cover.toString()), 'Cover charge: Invalid number')
      default:
        return BlankComponent()

    }
  }).publishReplay(1).refCount()

  const cover_input_component = {
    DOM: cover_input_component$.switchMap(x => x.DOM),
    output$: cover_input_component$.switchMap(x => x.output$)
  }

  const minimum_purchase_input_component$ = shared$.map((performer_cost: any) => {
    switch (performer_cost.type) {
      case opts.MINIMUM_PURCHASE:
      case opts.COVER_OR_MINIMUM_PURCHASE:
      case opts.COVER_AND_MINIMUM_PURCHASE:
        return MinimumPurchaseComponent(sources, O.of(performer_cost.data.minimum_purchase), 'Minimum purchase: Invalid number')
      default:
        return BlankComponent()

    }
  }).publishReplay(1).refCount()

  const minimum_purchase_input_component = {
    DOM: minimum_purchase_input_component$.switchMap(x => x.DOM),
    output$: minimum_purchase_input_component$.switchMap(x => x.output$)
  }

  return [
    cover_input_component,
    minimum_purchase_input_component
  ]

}

export default function main(sources, inputs) {
  const actions = intent(sources)

  const type_input$ = createProxy()
  const cover_input$ = createProxy()
  const minimum_purchase_input$ = createProxy()

  const options = [
    opts.FREE,
    opts.COVER,
    opts.MINIMUM_PURCHASE,
    opts.COVER_AND_MINIMUM_PURCHASE,
    opts.COVER_OR_MINIMUM_PURCHASE
  ]

  const state$ = model(actions, {
    ...inputs,
    type_input$,
    cover_input$,
    minimum_purchase_input$
  })

  const performer_cost$ = state$.pluck('performer_cost')
    .publishReplay(1).refCount()
  
  const [
    cover_input_component,
    minimum_purchase_input_component
  ] = getComponents(performer_cost$, sources, inputs)

  const type_component = isolate(CostTypeComboBox)(sources, inputs.options || options, performer_cost$.pluck('type').take(1))

  type_input$.attach(type_component.output$)
  cover_input$.attach(cover_input_component.output$)
  minimum_purchase_input$.attach(minimum_purchase_input_component.output$)

  const components = {
    type: type_component.DOM,
    cover: cover_input_component.DOM,
    minimum_purchase: minimum_purchase_input_component.DOM,
  }

  const vtree$ = view(state$, components, inputs.heading_text)

  return {
    DOM: vtree$,
    output$: state$.map(x => {
      const errors = Object.keys(x.errors_map).reduce((acc, val) => acc.concat(x.errors_map[val]), [])
      return {
        data: x.performer_cost,
        valid: errors.length === 0,
        errors
      }
    })
  }
}