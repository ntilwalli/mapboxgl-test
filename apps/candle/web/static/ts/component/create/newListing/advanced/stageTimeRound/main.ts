import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, em, span, input} from '@cycle/dom'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, isInteger} from '../../../../../utils'
import {ComboBox, BlankStructuredUndefined, FloatInputComponent, NumberInputComponent} from '../helpers'
import {
  MinutesTypeOptions, 
  StageTimeOptions
} from '../../../../../listingTypes'
import clone = require('clone')


function getMaxDefault() {
  return {
      max: 5
    }
}

function getRangeDefault() {
  return {
    min: 3,
    max: 5
  }
}

function getMinutesDataMaxDefault() {
  return {
    type: MinutesTypeOptions.MAX,
    data: getMaxDefault()
  }
}

function getMinutesDataRangeDefault() {
  return {
    type: MinutesTypeOptions.RANGE,
    data: getRangeDefault()
  }
}

function getSongsDataDefault() {
  return 2
}

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
      return x || getMaxDefault()
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

  const output$ = max_input.output$.map((max: any) => {
    return {
      ...max,
      data: {
        max: max.data
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
      return x || getRangeDefault()
    })
    .publishReplay(1).refCount()
  const max_message = component_id + ' max'
  const max_input = FloatInputComponent(sources, shared$.map(x => x ? x.max.toString() : undefined), max_message)
  const min_message = component_id + ' min'
  const min_input = FloatInputComponent(sources, shared$.map(x => x ? x.min.toString() : undefined), min_message)

  const vtree$ = combineObj({
    max: max_input.DOM,
    min: min_input.DOM
  }).map((components: any) => {
    const {max, min} = components
    return div('.d-flex', [
      span('.mr-xs', ['Min']),
      span('.mr-xs', [min]),
      span('.mr-xs', ['Max']),
      max
    ])
  })

  const output$ = combineObj({
    max: max_input.output$,
    min: min_input.output$
  }).map((components: any) => {
    const {max, min} = components
    const valid = min.valid && max.valid
    return {
      data: {
        min: min.data,
        max: max.data,
      },
      valid,
      errors: min.errors.concat(max.errors)
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}


function MinutesComponent(sources, options, props$, component_id) {
  const shared$ = props$
    .map(x => {
      return x || getMinutesDataMaxDefault()
    })
    .publishReplay(1).refCount()

  const minutes_options = options || [
    MinutesTypeOptions.MAX,
    MinutesTypeOptions.RANGE
  ]

  const type$ = shared$.pluck('type').take(1).publishReplay(1).refCount()
  const type_component = isolate(ComboBox)(sources, options, type$)
  const data_component$ = O.merge(
    shared$.take(1),
    type_component.output$.skip(1)
      .map(type => {
        switch (type) {
          case MinutesTypeOptions.MAX:
            return getMinutesDataMaxDefault()
          case MinutesTypeOptions.RANGE:
            return getMinutesDataRangeDefault()
          default:
            throw new Error()
        }
      }))
      .map((props: any) => {
        switch (props.type) {
          case MinutesTypeOptions.MAX:
            return MaxMinutesComponent(sources, O.of(props.data), component_id)
          case MinutesTypeOptions.RANGE: 
            return RangeMinutesComponent(sources, O.of(props.data), component_id)
          default: 
            throw new Error()
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
    return div('.d-flex', [
      span('.mr-xs', [type]),
      data,
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
        data: data.data
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
    return songs
  })

  return {
    DOM: vtree$,
    output$: songs_input.output$
  }
}



function getMinutesDefault() {
  return {
    minutes: getMinutesDataMaxDefault()
  }
}

function getSongsDefault() {
  return {
    songs: getSongsDataDefault()
  }
}

function getMinutesOrSongsDefault() {
  return {
    songs: getSongsDataDefault(),
    minutes: getMinutesDataMaxDefault()
  }
}

export function getDefault() {
  return {
    type: StageTimeOptions.MINUTES,
    data: getMinutesDefault()
  }
}

function toDefault(type) {
  switch (type) {
    case StageTimeOptions.MINUTES:
      return {
        type,
        data: getMinutesDefault()
      }
    case StageTimeOptions.SONGS:
      return {
        type,
        data: getSongsDefault()
      }
    case StageTimeOptions.MINUTES_OR_SONGS:
      return {
        type,
        data: getMinutesOrSongsDefault()
      }
    case StageTimeOptions.SEE_NOTE:
      return {
        type
      }
    default:
      throw new Error()
  }
}
 

export default function main(sources, inputs) {
  const component_id =  'Stage time'
  const shared$ = inputs.props$
    .map(x => {
      return x || getDefault()
    })
    .publishReplay(1).refCount()


  const options = inputs.options || [
    StageTimeOptions.MINUTES,
    StageTimeOptions.SONGS,
    StageTimeOptions.MINUTES_OR_SONGS,
    StageTimeOptions.SEE_NOTE
  ]

  const type_component = isolate(ComboBox)(sources, options, shared$.pluck('type'))

  const props$ = O.merge(
    shared$,
    type_component.output$.skip(1).map(toDefault)
  ).publishReplay(1).refCount()

  const minutes_options = inputs.minutes_options || [
    MinutesTypeOptions.MAX,
    MinutesTypeOptions.RANGE
  ]

  const minutes_component$ = props$.map((props: any) => {
    switch (props.type) {
      case StageTimeOptions.MINUTES:
      case StageTimeOptions.MINUTES_OR_SONGS:
        return MinutesComponent(sources, minutes_options, O.of(props.data.minutes), component_id + ' minutes')
      default:
        return BlankStructuredUndefined()

    }
  }).publishReplay(1).refCount()

  const minutes_component = {
    DOM: minutes_component$.switchMap(x => x.DOM),
    output$: minutes_component$.switchMap(x => x.output$)
  }

  const songs_component$ = props$.map((props: any) => {
    switch (props.type) {
      case StageTimeOptions.SONGS:
      case StageTimeOptions.MINUTES_OR_SONGS:
        return SongsComponent(sources, O.of(props.data.songs), component_id + ' songs')
      default:
        return BlankStructuredUndefined()
    }
  }).publishReplay(1).refCount()

  const songs_component = {
    DOM: songs_component$.switchMap(x => x.DOM),
    output$: songs_component$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
    type: type_component.DOM,
    minutes: minutes_component.DOM,
    songs: songs_component.DOM
  }).debounceTime(0).map((components: any) => {
    const {type, minutes, songs} = components

    const both = minutes && songs
    const line_type = inputs.heading_text ? '.input-line' : '.d-flex'

    return div('.row', [
      div('.col-12', [
        div('.row', [
          div('.col-12' + line_type, [
            inputs.heading_text ? div('.heading', [inputs.heading_text]) : null,
            div('.d-flex.align-items-center.flex-wrap', [
              div('.d-fx-a-c.fx-auto-width', {class: {'mb-xs': both}}, [type]),
              !both && minutes ? span('.d-fx-a-c.ml-xs', [
                minutes
              ]) : null,
              !both && songs ? span('.d-fx-a-c.ml-xs', [
                songs
              ]) : null
            ]),
          ])
        ]),
        both ? div('.row', [
          div('.col-12', [
            div('.row.mb-xs', [
              div('.col-12.d-flex.fx-auto-width.flex-wrap', [
                em('.mr-4', ['Minutes']),
                div('.d-fx-a-c', [
                  minutes,
                ])
              ])
            ]),
            div('.row', [
              div('.col-12.d-flex.fx-auto-width.flex-wrap', [
                em('.mr-4', ['Songs']),
                songs
              ])
            ])
          ])
        ]) : null
      ])
    ])  
  })

  const output$ = combineObj({
    type: type_component.output$,
    minutes: minutes_component.output$,
    songs: songs_component.output$
  }).debounceTime(0).map((components: any) => {
    const {type, minutes, songs} = components
    return {
      data: {
        type,
        data: (minutes || songs) ? {
          minutes: minutes.data,
          songs: songs.data
        } : undefined,
      },
      errors: minutes.errors.concat(songs.errors),
      valid: minutes.valid && songs.valid
    }
  })
 
  return {
    DOM: vtree$,
    output$: output$.map(data => ({
      data,
      index: inputs.component_index
    }))
  }
}