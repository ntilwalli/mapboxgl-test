import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, isInteger} from '../../../../../utils'
import {ComboBox, BlankStructuredUndefined, FloatInputComponent, NumberInputComponent} from '../helpers'
import {TierBenefitOptions, StageTimeOptions} from '../../helpers'
import clone = require('clone')


function getMinutesDefault() {
  return 5
}

function getSongsDefault() {
  return 2
}

function getPriorityOrderDefault() {
  return undefined
}

export function getDefault() {
  return {
    type: TierBenefitOptions.MINUTES,
    data: getMinutesDefault()
  }
}

function MinutesComponent(sources, props$, component_id = '') {
  const shared$ = props$
      .map(x => {
      return x || getMinutesDefault()
    })
    .publishReplay(1).refCount()
  const max_message = component_id + ': Invalid number'
  const max_input = FloatInputComponent(sources, shared$.map(x => x ? x.toString() : undefined), max_message)
  return max_input
}

function SongsComponent(sources, props$, component_id) {
  const shared$ = props$.publishReplay(1).refCount()
  const message = component_id + ': Invalid number'
  const songs_input = NumberInputComponent(sources, shared$.map(x => x.toString()), message)

  return songs_input
}

function toDefault(type) {
  switch (type) {
    case TierBenefitOptions.MINUTES:
      return {
        type,
        data: getMinutesDefault()
      }
    case TierBenefitOptions.SONGS:
      return {
        type,
        data: getSongsDefault()
      }
    case TierBenefitOptions.PRIORITY_ORDER:
      return {
        type,
        data: getPriorityOrderDefault()
      }
    default:
      throw new Error()
  }
}
 

export default function main(sources, inputs) {
  const component_id =  'Cost tier'
  const shared$ = inputs.props$
    .map(x => {
      return x || getDefault()
    })
    .publishReplay(1).refCount()


  const options = inputs.options || [
    TierBenefitOptions.MINUTES,
    TierBenefitOptions.SONGS,
    //TierBenefitOptions.PRIORITY_ORDER
  ]

  const type_component = isolate(ComboBox)(sources, options, shared$.pluck('type'))

  const props$ = O.merge(
    shared$,
    type_component.output$.skip(1).map(toDefault)
  ).publishReplay(1).refCount()


  const minutes_component$ = props$.map((props: any) => {
    switch (props.type) {
      case TierBenefitOptions.MINUTES:
        return MinutesComponent(sources, O.of(props.data), component_id + ' minutes')
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
      case TierBenefitOptions.SONGS:
        return SongsComponent(sources, O.of(props.data), component_id + ' songs')
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

    return div(`.row`, [
      span('.item', [type]),
      minutes,
      songs
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
        data: minutes && minutes.data || songs && songs.data || undefined,
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