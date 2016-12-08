import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
// import Immutable = require('immutable')
// import {combineObj} from '../../../../../utils'
import intent from './intent'
import model from './model'
import view from './view'
import deepEqual = require('deep-equal')
import {combineObj, createProxy} from '../../../../../utils'
import {MinutesTypeOptions, StageTimeOptions, ComboBox, BlankComponent, NumberInputComponent} from '../../helpers'
import clone = require('clone')


function MinutesTypeComboBox(sources, props$) {
  const options = [
    MinutesTypeOptions.MAX,
    MinutesTypeOptions.RANGE
  ]

  return isolate(ComboBox)(sources, options, props$)
}

function StageTimeTypeComboBox(sources, props$) {
  const options = [
    StageTimeOptions.MINUTES,
    StageTimeOptions.SONGS,
    StageTimeOptions.MINUTES_OR_SONGS
  ]

  return isolate(ComboBox)(sources, options, props$)
}

function MaxMinutesComponent(sources, props$, component_id = '') {
  const shared$ = props$.publishReplay(1).refCount()
  const max_message = component_id.length ? compnent_id + ' minutes: Invalid number' : 'Minutes: Invalid number'
  const max_input = NumberInputComponent(sources, props$.map(x => x.data.max.toString()), max_message)

  const vtree$ = combineObj({
    max: max_input.DOM,
  }).map((components: any) => {
    const {max} = components
    return div('.row', [
      span('.item', [max])
    ])
  })

  const output$ = max_input.output$.map(max => ({
    ...max,
    value: {
      max: max.value
    }
  }))

  return {
    DOM: vtree$,
    output$
  }
}

function RangeMinutesComponent(sources, props$, component_id = '') {
  const shared$ = props$.publishReplay(1).refCount()
  const max_message = component_id.length ? compnent_id + ' max minutes: Invalid number' : 'Max minutes: Invalid number'
  const max_input = NumberInputComponent(sources, props$.map(x => x.data.max.toString()), max_message)
  const min_message = component_id.length ? compnent_id + ' min minutes: Invalid number' : 'Min minutes: Invalid number'
  const min_input = NumberInputComponent(sources, props$.map(x => x.data.min.toString()), min_message)

  const vtree$ = combineObj({
    max: max_input.DOM,
    min: min_input.DOM
  }).map((components: any) => {
    const {max, min} = components
    return div('.col', [
      div('.row', [
        span('.sub-sub-heading.item', ['Min'])
        span('.item', [min]),
      ]),
      div('.row', [
        span('.sub-sub-heading.item', ['Max'])
        span('.item', [max])
      ])
    ])
  })

  const output$ = combineObj({
    max: max_input.output$,
    min: min_input.output$
  }).map((components: any) => {
    const {max, min} = components
    return {
      value: {
        min: min.value,
        max: max.value,
      },
      valid: min.valid && max.valid,
      errors: min.errors.concat(max.errors)
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

function MinutesComponent(sources, props$, component_id = '') {
  const shared$ = props$.publishReplay(1).refCount()
  const type$ = shared$.pluck('type').publishReplay(1).refCount()
  const type_component = MinutesTypeComboBox(sources, type$)
  const data_component$ = type$.map(type => {
    switch (type) {
      case MinutesTypeOptions.MAX:
        return MaxMinutesComponent(sources, shared$.pluck('data'), component_id)
      default: 
        return RangeMinutesComponent(sources, shared$.pluck('data'), component_id)
    }
  }).publishReplay(1).refCount()

  const data_component = {
    DOM: minutes_component$.switchMap(x => x.DOM),
    output$: minutes_component$.switchMap(x => x.output$)
  }

  const min_input = NumberInputComponent(sources, shared$.map(x => x.data.min.toString()), min_message)

  const vtree$ = combineObj({
    type: type_component.DOM,
    data: data_component.DOM
  }).map((components: any) => {
    const {type, data} = components
    return div('.col', [
      div('.row', [
        span('.sub-sub-heading.item', ['Minutes'])
        span('.item', [type]),
        span('.item', [data]),
      ])
    ])
  })

  const output$ = combineObj({
    type: type_component.output$,
    data: data_component.output$
  }).map((components: any) => {
    const {type, data} = components
    return {
      ...data,
      value: {
        type,
        data
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

function SongsComponent(sources, props$, component_id = '') {
  const shared$ = props$.publishReplay(1).refCount()
  const message = component_id.length ? compnent_id + ' songs: Invalid number' : 'Songs: Invalid number'
  const songs_input = NumberInputComponent(sources, shared$.map(x => x.songs.toString()), message)

  const vtree$ = songs_input.DOM.map(songs => {
    const  = components
    return div('.col', [
      div('.row', [
        span('.sub-sub-heading.item', ['Songs'])
        span('.item', [songs])
      ])
    ])
  })

  return {
    DOM: vtree$,
    output$: songs_input.outpu$
  }
}

function getComponents(stage_time$, sources, inputs) {
  const shared$ = stage_time$
    .map(x => {
      return clone(x)
    })
    .distinctUntilChanged((x, y) => x.type === y.type)
    .publishReplay(1).refCount()

  const type$ = shared$.pluck('type').publishReplay(1).refCount()

  const minutes_component$ = shared$.map((stage_time: any) => {
    switch (stage_time.type) {
      case StageTimeOptions.MINUTES:
      case StageTimeOptions.MINUTES_OR_SONGS:
        return MinutesComponent(sources, O.of(stage_time.data), 'Cover charge: Invalid number')
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
      case opts.MINUMUM_PURCHASE:
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
    opts.MINUMUM_PURCHASE,
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

  const type_component = CostTypeComboBox(sources, options, performer_cost$.pluck('type').take(1))

  type_input$.attach(type_component.output$)
  cover_input$.attach(cover_input_component.output$)
  minimum_purchase_input$.attach(minimum_purchase_input_component.output$)

  const components = {
    type: type_component.DOM,
    cover: cover_input_component.DOM,
    minimum_purchase: minimum_purchase_input_component.DOM,
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$.map(x => {
      const errors = Object.keys(x.errors_map).reduce((acc, val) => acc.concat(x.errors_map[val]), [])
      return {
        prop: x.performer_cost,
        valid: errors.length === 0,
        errors
      }
    })
  }
}