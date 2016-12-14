import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, isInteger} from '../../../../../utils'
import {ComboBox, BlankStructuredUndefined, FloatInputComponent, NumberInputComponent} from '../helpers'
import {TierPerkOptions, StageTimeOptions} from '../../helpers'
import clone = require('clone')

// function optionToText(type) {
//   switch (type) {
//     case TierPerkOptions.MINUTES:
//       return "Additional minutes"
//     case TierPerkOptions.MINUTES_AND_PRIORITY_ORDER:
//       return "Additional minutes + priority order"
//     case TierPerkOptions.SONGS:
//       return "Additional songs"
//     case TierPerkOptions.SONGS_AND_PRIORITY_ORDER:
//       return "Additional songs + priority order"
//     case TierPerkOptions.PRIORITY_ORDER:
//       return "Priority order"
//     case TierPerkOptions.BUCKET_ENTRY:
//       return "Additional bucket entry"
//     case TierPerkOptions.NO_PERK:
//       return "No perk"
//     default:
//       throw new Error()
//   }
// }


function getMinutesDefault() {
  return 5
}

function getSongsDefault() {
  return 2
}
function getAdditionalMinutesDefault() {
  return 2
}

function getAdditionalSongsDefault() {
  return 1
}

function getAdditionalBucketEntryDefault() {
  return 1
}

function getPriorityOrderDefault() {
  return undefined
}

export function getDefault() {
  return {
    type: TierPerkOptions.MINUTES,
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

function BucketEntryComponent(sources, props$, component_id) {
  const shared$ = props$.publishReplay(1).refCount()
  const message = component_id + ': Invalid number'
  const songs_input = NumberInputComponent(sources, shared$.map(x => x.toString()), message)

  return songs_input
}

function toDefault(type) {
  switch (type) {
    case TierPerkOptions.MINUTES:
    case TierPerkOptions.MINUTES_AND_PRIORITY_ORDER:
      return {
        type,
        data: getMinutesDefault()
      }
    case TierPerkOptions.ADDITIONAL_MINUTES_AND_PRIORITY_ORDER:
      return {
        type,
        data: getAdditionalMinutesDefault()
      }
    case TierPerkOptions.SONGS:
    case TierPerkOptions.SONGS_AND_PRIORITY_ORDER:
      return {
        type,
        data: getSongsDefault()
      }
    case TierPerkOptions.ADDITIONAL_SONGS_AND_PRIORITY_ORDER:
      return {
        type,
        data: getAdditionalSongsDefault()
      }
    case TierPerkOptions.PRIORITY_ORDER:
      return {
        type,
        data: getPriorityOrderDefault()
      }
    case TierPerkOptions.ADDITIONAL_BUCKET_ENTRY:
      return {
        type,
        data: getAdditionalBucketEntryDefault()
      }
    case TierPerkOptions.NO_PERK:
      return {
        type,
        data: undefined
      }
    default:
      throw new Error()
  }
}
 

export default function main(sources, inputs) {
  const component_id =  'Tier perk'
  const shared$ = inputs.props$
    .map(x => {
      return x || getDefault()
    })
    .publishReplay(1).refCount()


  const options = inputs.options || [
    TierPerkOptions.NO_PERK,
    TierPerkOptions.MINUTES,
    TierPerkOptions.SONGS,
    TierPerkOptions.PRIORITY_ORDER,
    TierPerkOptions.ADDITIONAL_BUCKET_ENTRY,
    TierPerkOptions.MINUTES_AND_PRIORITY_ORDER,
    TierPerkOptions.SONGS_AND_PRIORITY_ORDER
  ]

  const type_component = isolate(ComboBox)(sources, options, shared$.pluck('type'))

  const props$ = O.merge(
    shared$,
    type_component.output$.skip(1).map(toDefault)
  ).publishReplay(1).refCount()


  const minutes_component$ = props$.map((props: any) => {
    switch (props.type) {
      case TierPerkOptions.MINUTES:
      case TierPerkOptions.MINUTES_AND_PRIORITY_ORDER:
      case TierPerkOptions.ADDITIONAL_MINUTES_AND_PRIORITY_ORDER:
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
      case TierPerkOptions.SONGS:
      case TierPerkOptions.SONGS_AND_PRIORITY_ORDER:
      case TierPerkOptions.ADDITIONAL_SONGS_AND_PRIORITY_ORDER:
        return SongsComponent(sources, O.of(props.data), component_id + ' songs')
      default:
        return BlankStructuredUndefined()
    }
  }).publishReplay(1).refCount()

  const songs_component = {
    DOM: songs_component$.switchMap(x => x.DOM),
    output$: songs_component$.switchMap(x => x.output$)
  }

  const bucket_entry_component$ = props$.map((props: any) => {
    switch (props.type) {
      case TierPerkOptions.ADDITIONAL_BUCKET_ENTRY:
        return BucketEntryComponent(sources, O.of(props.data), component_id + ' songs')
      default:
        return BlankStructuredUndefined()
    }
  }).publishReplay(1).refCount()

  const bucket_entry_component = {
    DOM: bucket_entry_component$.switchMap(x => x.DOM),
    output$: bucket_entry_component$.switchMap(x => x.output$)
  }

  function hasMinutes(type) {
    return type === TierPerkOptions.MINUTES || 
      type === TierPerkOptions.MINUTES_AND_PRIORITY_ORDER ||
      type === TierPerkOptions.ADDITIONAL_MINUTES_AND_PRIORITY_ORDER
  }

  function hasSongs(type) {
    return type === TierPerkOptions.SONGS || 
      type === TierPerkOptions.SONGS_AND_PRIORITY_ORDER ||
      type === TierPerkOptions.ADDITIONAL_MINUTES_AND_PRIORITY_ORDER
  }

  function hasBucketEntry(type) {
    return type === TierPerkOptions.ADDITIONAL_BUCKET_ENTRY
  }

  const vtree$ = combineObj({
    type: type_component.DOM,
    minutes: minutes_component.DOM,
    songs: songs_component.DOM,
    bucket_entry: bucket_entry_component.DOM
  }).debounceTime(0).map((components: any) => {
    const {type, minutes, songs, bucket_entry} = components
    return div(`.row`, [
      bucket_entry ? span('.item.bucket_entry', [bucket_entry]) : null,
      songs ? span('.item.songs', [songs]) : null,
      minutes ? span('.item.minutes', [minutes]) : null,
      type
    ]) 
  })

  const output$ = combineObj({
    type: type_component.output$,
    minutes: minutes_component.output$,
    songs: songs_component.output$,
    bucket_entry: bucket_entry_component.output$
  }).debounceTime(0).map((components: any) => {
    const {type, minutes, songs, bucket_entry} = components
    const component = hasMinutes(type) ? minutes:
                 hasSongs(type) ? songs:
                 hasBucketEntry(type) ? bucket_entry : {data: undefined, errors: [], valid: true}
    return {
      data: {
        type,
        data: component.data
      },
      errors: component.errors,
      valid: component.valid
    }
  })
 
  return {
    DOM: vtree$,
    output$: output$
  }
}