import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import intent from './intent'
import model from './model'
import view from './view'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, isInteger} from '../../../../../utils'
import {MinutesTypeOptions, StageTimeOptions, ComboBox, BlankComponent, FloatInputComponent, NumberInputComponent} from '../helpers'
import clone = require('clone')


function StageTimeTypeComboBox(sources, props$) {
  const options = [
    StageTimeOptions.MINUTES,
    StageTimeOptions.SONGS,
    StageTimeOptions.MINUTES_OR_SONGS
  ]

  return isolate(ComboBox)(sources, options, props$)
}

function MinutesTypeComboBox(sources, props$) {
  const options = [
    MinutesTypeOptions.MAX,
    MinutesTypeOptions.RANGE
  ]

  return isolate(ComboBox)(sources, options, props$)
}

function MaxMinutesComponent(sources, props$, component_id = '') {
  const shared$ = props$
      .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const max_message = component_id + ': Invalid number'
  const max_input = FloatInputComponent(sources, shared$.pluck('max').map(x => x ? x.toString() : undefined), max_message)

  const vtree$ = combineObj({
    max: max_input.DOM,
  }).map((components: any) => {
    const {max} = components
    return max
  })

  const output$ = max_input.output$.map(max => {
    return {
      ...max,
      data: {
        max: max.valid ? max.data : undefined
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

function RangeMinutesComponent(sources, props$, component_id) {
  const shared$ = props$
    .map(x => {
      return {
        min: x.min || 3,
        max: x.max || 5
      }
    })
    .publishReplay(1).refCount()
  const max_message = component_id + ': Invalid max number'
  const max_input = FloatInputComponent(sources, shared$.map(x => x.max.toString()), max_message)
  const min_message = component_id + ': Invalid min number'
  const min_input = FloatInputComponent(sources, shared$.map(x => x.min.toString()), min_message)

  const vtree$ = combineObj({
    max: max_input.DOM,
    min: min_input.DOM
  }).map((components: any) => {
    const {max, min} = components
    return div('.col', [
      div('.row', [
        span('.sub-sub-heading.item.flex.align-center', ['Min']),
        span('.item', [min]),
        span('.sub-sub-heading.item.flex.align-center', ['Max']),
        span([max])
      ])
    ])
  })

  const output$ = combineObj({
    max: max_input.output$,
    min: min_input.output$
  }).map((components: any) => {
    const {max, min} = components
    const valid = min.valid && max.valid
    return {
      data: valid ? {
        min: min.data,
        max: max.data,
      } : undefined,
      valid: min.valid && max.valid,
      errors: min.errors.concat(max.errors)
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

function MinutesComponent(sources, props$, component_id) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const type$ = shared$.pluck('type').publishReplay(1).refCount()
  const type_component = MinutesTypeComboBox(sources, type$)
  const data_component$ = O.merge(type_component.output$, type$).map(type => {
    switch (type) {
      case MinutesTypeOptions.MAX:
        return MaxMinutesComponent(sources, shared$.pluck('data'), component_id)
      default: 
        return RangeMinutesComponent(sources, shared$.pluck('data'), component_id)
    }
  }).publishReplay(1).refCount()

  const data_component = {
    DOM: data_component$.switchMap(x => x.DOM),
    output$: data_component$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
    type: type_component.DOM,
    data: data_component.DOM
  }).map((components: any) => {
    const {type, data} = components
    return div('.col', [
      div('.row', [
        span('.item', [type]),
        data,
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
      data: {
        type,
        data: data.valid ? data.data : undefined
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

function SongsComponent(sources, props$, component_id) {
  const shared$ = props$.publishReplay(1).refCount()
  const message = component_id + ': Invalid number'
  const songs_input = NumberInputComponent(sources, shared$.map(x => x.toString()), message)

  const vtree$ = songs_input.DOM.map(songs => {
    return div('.col', [
      div('.row', [
        span('.item', [songs])
      ])
    ])
  })

  return {
    DOM: vtree$,
    output$: songs_input.output$
  }
}

function getComponents(stage_time$, sources, inputs, component_id) {
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
        return MinutesComponent(sources, O.of(stage_time.data.minutes), component_id + ' minutes')
      default:
        return BlankComponent()

    }
  }).publishReplay(1).refCount()

  const minutes_component = {
    DOM: minutes_component$.switchMap(x => x.DOM),
    output$: minutes_component$.switchMap(x => x.output$)
  }

  const songs_component$ = shared$.map((stage_time: any) => {
    switch (stage_time.type) {
      case StageTimeOptions.SONGS:
      case StageTimeOptions.MINUTES_OR_SONGS:
        return SongsComponent(sources, O.of(stage_time.data.songs), component_id + ' songs')
      default:
        return BlankComponent()

    }
  }).publishReplay(1).refCount()

  const songs_component = {
    DOM: songs_component$.switchMap(x => x.DOM),
    output$: songs_component$.switchMap(x => x.output$)
  }

  return [
    minutes_component,
    songs_component
  ]
}

export default function main(sources, inputs) {
  const actions = intent(sources)

  const type_input$ = createProxy()
  const minutes_input$ = createProxy()
  const songs_input$ = createProxy()


  const state$ = model(actions, {
    ...inputs,
    type_input$,
    minutes_input$,
    songs_input$
  })

  const stage_time$ = state$.pluck('stage_time')
    .publishReplay(1).refCount()
  
  const type_component = StageTimeTypeComboBox(sources, stage_time$.pluck('type').take(1))

  const [
    minutes_component,
    songs_component
  ] = getComponents(stage_time$, sources, inputs, inputs.component_id)

  type_input$.attach(type_component.output$)
  minutes_input$.attach(minutes_component.output$)
  songs_input$.attach(songs_component.output$)

  const components = {
    type: type_component.DOM,
    songs: songs_component.DOM,
    minutes: minutes_component.DOM,
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$.map(x => {
      const errors = Object.keys(x.errors_map).reduce((acc, val) => acc.concat(x.errors_map[val]), [])
      const valid = errors.length === 0 
      const data = {
        data: valid ? x.stage_time : undefined,
        valid,
        errors
      }
      return {
        data, 
        index: inputs.component_index
      }
    })
  }
}