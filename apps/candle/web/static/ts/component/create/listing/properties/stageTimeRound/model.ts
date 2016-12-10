import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'
import deepEqual = require('deep-equal')
import {StageTimeOptions, MinutesTypeOptions} from '../helpers'
import clone = require('clone')

function getMinutesDefault() {
  return {
    type: MinutesTypeOptions.MAX,
    data: {
      max: 5
    }
  }
}

function getSongsDefault() {
  return 2
}

function getDefault() {
  return {
    type: StageTimeOptions.MINUTES,
    data: {
      minutes: getMinutesDefault()
    }
  }
}

export function getCollectionDefault() {
  return {
    data: getDefault(),
    valid: true,
    errors: []
  }
}

function reducers(actions, inputs) {

  const type_input_r = inputs.type_input$.map(msg => state => {

    return state.update('stage_time', stage_time => {
      stage_time.type = msg
      switch (msg) {
        case StageTimeOptions.MINUTES:
          stage_time.data = {
            minutes: getMinutesDefault()
          }
          break
        case StageTimeOptions.SONGS:
          stage_time.data = {
            songs: getSongsDefault()
          }
          break
        //case StageTimeOptions.MINUTES_OR_SONGS:
        case StageTimeOptions.MINUTES_OR_SONGS:
          stage_time.data = {
            minutes: getMinutesDefault(),
            songs: getSongsDefault()
          }
          break
        default:
          throw new Error('Invalid stage time type: ' + msg)
      }

      return stage_time
    })
  })

  const minutes_input_r = inputs.minutes_input$.map(msg => state => {
    //console.log('in person input msg', msg)
    return state.update('errors_map', errors_map => {
      errors_map['minutes-input'] = msg.errors
      return errors_map
    }).update('stage_time', stage_time => {
      stage_time.data.minutes = msg.valid ? msg.data : undefined
      return stage_time
    })
  })

  const songs_input_r = inputs.songs_input$.map(msg => state => {
    //console.log('in person input msg', msg)
    return state.update('errors_map', errors_map => {
      errors_map['songs-input'] = msg.errors
      return errors_map
    }).update('stage_time', stage_time => {
      stage_time.data.songs = msg.valid ? msg.data : undefined
      return stage_time
    })
  })

  return O.merge(type_input_r, minutes_input_r, songs_input_r)
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$.take(1)
    .switchMap(props => {
      const init = {
        stage_time: props.data || getDefault(),
        errors_map: {}
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .debounceTime(0)
    .map((x: any) => clone(x.toJS()))
    //.do(x => console.log(`cost state`, x))
    .publishReplay(1).refCount()
}