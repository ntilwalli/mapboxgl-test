import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, blankComponentUndefinedDOM} from '../../../../../utils'
import {CostOptions, PurchaseTypeOptions, BlankStructuredUndefined, CostTypeComboBox, PurchaseTypeComboBox, FloatInputComponent, NumberInputComponent} from '../helpers'
import clone = require('clone')

export function getDefault() {
  return {
    type: CostOptions.FREE,
    data: undefined
  }
}

export function getStructuredDefault() {
  return {
    data: getDefault(),
    valid: true,
    errors: []
  }
}

function minimumPurchaseDefault() {
  return {
    type: PurchaseTypeOptions.DRINK,
    data: 1
  }
}

function MinimumPurchaseComponent(sources, props$, component_id) {
  const shared$ = props$
    .map(x => x || minimumPurchaseDefault())
    .publishReplay(1).refCount()
  const number_input = NumberInputComponent(sources, props$.map(x => x.data.toString()), 'Minimum purchase: Invalid number')
  const p_opts = PurchaseTypeOptions
  const options = [
    PurchaseTypeOptions.DRINK,
    PurchaseTypeOptions.ITEM,
    //p_opts.DRINK_OR_ITEM,
    PurchaseTypeOptions.DOLLARS
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
    const valid = !! data.valid
    const errors: string[] = data.errors
    return {
      data: {
        data: data.data,
        type
      },
      valid,
      errors
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

const toDefault = type => {
  switch (type) {
    case CostOptions.FREE:
      return {
        type
      }
    case CostOptions.COVER_AND_MINIMUM_PURCHASE:
    case CostOptions.COVER_OR_MINIMUM_PURCHASE:
      return {
        type,
        data: {
          cover: 5,
          minimum_purchase: minimumPurchaseDefault()
        }
      }
    case CostOptions.COVER:
      return {
        type,
        data: {
          cover: 5
        }
      }
    case CostOptions.MINIMUM_PURCHASE:
      return {
        type,
        data: {
          minimum_purchase: minimumPurchaseDefault()
        }
      }
    default: 
      throw new Error()
  }
}

export default function main(sources, inputs) {
  const shared$ = inputs.props$
    .map(x => {
      return x || getDefault()
    })
    .publishReplay(1).refCount()

  const component_id = 'Cost'

  const options = inputs.options || [
    CostOptions.FREE,
    CostOptions.COVER,
    CostOptions.MINIMUM_PURCHASE,
    CostOptions.COVER_AND_MINIMUM_PURCHASE,
    CostOptions.COVER_OR_MINIMUM_PURCHASE
  ]

  const type_component = isolate(CostTypeComboBox)(sources, options, shared$.pluck('type').take(1))
  const type$ = type_component.output$.publishReplay(1).refCount() 
  const props$ = O.merge(shared$, type$.skip(1).map(toDefault)).publishReplay(1).refCount()

  const cover_component$ = props$
    .map((props: any) => {
      //const data: any = props.data
      switch (props.type) {
        case CostOptions.COVER_AND_MINIMUM_PURCHASE:
        case CostOptions.COVER_OR_MINIMUM_PURCHASE:
        case CostOptions.COVER:
          return  FloatInputComponent(
            sources, 
            O.of(props.data.cover ? props.data.cover.toString() : "5"),
            component_id + ': Invalid number'
          )
        default: 
          return BlankStructuredUndefined()
      }
    }).publishReplay(1).refCount()

  const cover_component = {
    DOM: cover_component$.switchMap(x => x.DOM),
    output$: cover_component$.switchMap(x => x.output$)
  }


  const minimum_purchase_component$ = props$
    .map((props: any) => {
      switch (props.type) {
        case CostOptions.COVER_AND_MINIMUM_PURCHASE:
        case CostOptions.COVER_OR_MINIMUM_PURCHASE:
        case CostOptions.MINIMUM_PURCHASE:
          return  MinimumPurchaseComponent(
            sources, 
            O.of(props.data.minimum_purchase), 
            component_id + ': Invalid number'
          )
        default: 
          return BlankStructuredUndefined()
      }
    }).publishReplay(1).refCount()

  const minimum_purchase_component = {
    DOM: minimum_purchase_component$.switchMap(x => x.DOM),
    output$: minimum_purchase_component$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
      type: type_component.DOM,
      cover: cover_component.DOM, 
      minimum_purchase: minimum_purchase_component.DOM
    }).debounceTime(0).map((components: any) => {
      const {type, cover, minimum_purchase} = components
      const both = cover && minimum_purchase

      return div('.column', [
        inputs.heading_text ? div('.sub-heading.section-heading ', [inputs.heading_text]) : null,
        div({class: {row: !both, column: both}}, [
          span(`.item`, {class: {'small-margin-bottom': both}}, [type]),
          cover ? div(`.row.align-center.small-margin-bottom`, [
            both ? span('.sub-sub-heading.align-center', ['Cover']) : null,
            span(`.item`, [span('.row', [span('.item', [cover]), span('.item.flex.align-center', ['dollars'])])])
          ]) : null,
          minimum_purchase ? div('.row.align-center', [
            both ? span('.sub-sub-heading.align-center', ['Minimum purchase']) : null,
            span('.item', [minimum_purchase]),
          ]) : null
        ])  
      ])     
    })

  const output$ = combineObj({
      type: type_component.output$,
      cover: cover_component.output$, 
      minimum_purchase: minimum_purchase_component.output$
    }).debounceTime(0).map((components: any) => {
      const {type, cover, minimum_purchase} = components
      const errors = cover.errors.concat(minimum_purchase.errors)
      const valid = cover.valid && minimum_purchase.valid

      return {
        data: {
          type,
          data: (cover.data || minimum_purchase.data) ? {
            cover: cover.data,
            minimum_purchase: minimum_purchase.data
          } : undefined, 
        },
        valid,
        errors
      }
    })

  return {
    DOM: vtree$,
    output$: output$.map(x => {
      if (inputs.component_index) {
        return {
          data: x,
          index: inputs.component_index
        }
      } else {
        return x
      }
    })
  }
}