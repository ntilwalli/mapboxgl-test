import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'
import deepEqual = require('deep-equal')
import {getTimeOptionDefault} from '../helpers'

function getDefault() {
  return {
    begins: {
      type: 'minutes-before-event-start',
      data: 15
    },
    ends: {
      type: 'minutes-after-event-start',
      data: 15
    },
    radius: 50
  }
}

function reducers(actions, inputs) {

  const radius_input_r = inputs.radius_input$.map(msg => state => {

    return state.update('errors_map', errors_map => {
      errors_map['radius'] = msg.errors
      return errors_map
    }).update(`check_in`, check_in => {
      if (msg.valid) {
        check_in.radius = msg.value
      } else {
        check_in.radius = undefined
      }

      return check_in
    })
  })

  const begins_input_r = inputs.begins_input$.map(msg => state => {
    //console.log('in person input msg', msg)
    return state.update('errors_map', errors_map => {
      errors_map['begins-input'] = msg.errors
      return errors_map
    }).update(`check_in`, check_in => {
      if (msg.valid) {
        check_in.begins.data = msg.value
      } else {
        check_in.begins.data = undefined
      }

      return check_in
    })
  })

  const ends_input_r = inputs.ends_input$.map(msg => state => {
    //console.log('in person input msg', msg)
    return state.update('errors_map', errors_map => {
      errors_map['ends-input'] = msg.errors
      return errors_map
    }).update(`check_in`, check_in => {
      if (msg.valid) {
        check_in.ends.data = msg.value
      } else {
        check_in.ends.data = undefined
      }

      return check_in
    })
  })

  const ends_time_type_input_r = inputs.ends_time_type_input$.map(msg => state => {
    //console.log('in person time type msg', msg)
    return state.update(`check_in`, check_in => {

      check_in.ends = { type: msg, data: msg.length ? getTimeOptionDefault(msg) : undefined }

      return check_in
    })
  })


  return O.merge(
    radius_input_r, begins_input_r, ends_input_r, ends_time_type_input_r
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$
    //.map(x => x.performer_signup)
    //.distinctUntilChanged((x, y) => deepEqual(x, y))
    .switchMap(props => {
      const init = {
        check_in: props || getDefault(),
        errors_map: {}
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .debounceTime(0)
    .map((x: any) => x.toJS())
    //.do(x => console.log(`performerSignup state`, x))
    .publishReplay(1).refCount()
}