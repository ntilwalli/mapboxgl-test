import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'
import deepEqual = require('deep-equal')

function getRegistrationDefault() {
  return [{
    type: 'app',
    data: {
      begins: undefined,
      ends: {
        type: 'start-of-event'
      }
    }
  }]
}

function getInPersonDefault() {
  return {
    begins: {
      type: 'before-event',
      data: 15
    },
    types: ['bucket']
  }
}

function reducers(actions, inputs) {
  const type_r = actions.type$.map(msg => state => {
    return state.update(`performer_signup`, performer_signup => {
      const {value, checked} = msg
      const index = performer_signup.findIndex(x => x.type === value)
      if (index >= 0) {
        performer_signup.splice(index, 1)
      } else {
        if (value === 'registration') {
          performer_signup.push({
            type: value,
            data: getRegistrationDefault()
          })
        } else if (value === 'in-person') {
          performer_signup.push({
            type: value,
            data: getInPersonDefault()
          })
        } else {
          throw new Error('Invalid sign-up type')
        }
      }

      return performer_signup
    })
  })

  return O.merge(type_r)
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$
    //.map(x => x.performer_signup)
    //.distinctUntilChanged((x, y) => deepEqual(x, y))
    .switchMap(props => {
      const init = {
        performer_signup: props || []
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .do(x => console.log(`performerSignup state`, x))
    .publishReplay(1).refCount()
}