import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'
import deepEqual = require('deep-equal')

function getInAppDefault() {
  return {
    type: 'in-app',
    data: {
      begins: {
        type: 'upon-posting', //'days-before-event-start', 'minutes-before-event-start', 'previous-weekday-at-time
        data: undefined
      },
      ends: {
        type: 'event-start', // 'minutes-after-event-start', 'minutes-before-event-end', 'event-end'
        data: undefined
      }
    }
  }
}

function getInPersonDefault() {
  return {
    begins: {
      type: 'minutes-before-event-start',
      data: 15
    },
    styles: ['bucket']
  }
}

function getInPersonIndex(arr) {
  return arr.findIndex(x => x.type === 'in-person')
}

function getRegistrationIndex(arr) {
  return arr.findIndex(x => x.type === 'registration')
}

function hasInPerson(arr) {
  if (getInPersonIndex(arr) >= 0) return true

  return false
}

function hasRegistration(arr) {
  if (getInPersonIndex(arr) >= 0) return true

  return false
}

function reducers(actions, inputs) {
  const type_r = actions.type$.map(msg => state => { 
    const {value, checked} = msg   
    return state.update(`performer_signup`, performer_signup => {
      const index = performer_signup.findIndex(x => x.type === value)
      if (index >= 0) {
        performer_signup.splice(index, 1)
      } else {
        if (value === 'registration') {
          performer_signup.push({
            type: value,
            data: undefined
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
    }).update('errors_map', errors_map => {
      errors_map[value] = []
      return errors_map
    })
  })

  const in_person_style_r = actions.in_person_style$.map(msg => state => {

    return state.update(`performer_signup`, performer_signup => {

      let index = performer_signup.findIndex(x => x.type === 'in-person')
      const styles = performer_signup[index].data.styles
      index = styles.findIndex(x => x === msg.type)
      if (index >= 0) {
        styles.splice(index, 1)
      } else {
        styles.push(msg.type)
      }

      return performer_signup
    })
  })

  const in_person_input_r = inputs.in_person_input$.map(msg => state => {
    //console.log('in person input msg', msg)
    return state.update('errors_map', errors_map => {
      errors_map['in-person'] = msg.errors
      return errors_map
    }).update(`performer_signup`, performer_signup => {

      let index = performer_signup.findIndex(x => x.type === 'in-person')
      if (msg.valid) {
        performer_signup[index].data.begins.data = msg.value
      } else {
        performer_signup[index].data.begins.data = undefined
      }

      return performer_signup
    })

    // return state.update(`performer_signup`, performer_signup => {

    //   let index = performer_signup.findIndex(x => x.type === 'in-person')
    //   const styles = performer_signup[index].data.styles
    //   index = styles.findIndex(x => x.type === msg.type)
    //   if (index >= 0) {
    //     styles.splice(index, 1)
    //   } else {
    //     styles.push(msg.type)
    //   }

    //   return performer_signup
    // })
  })


  return O.merge(type_r, in_person_style_r, in_person_input_r)
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$
    //.map(x => x.performer_signup)
    //.distinctUntilChanged((x, y) => deepEqual(x, y))
    .switchMap(props => {
      const init = {
        performer_signup: props || [],
        errors_map: {}
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .debounceTime(0)
    .map((x: any) => x.toJS())
    .do(x => console.log(`performerSignup state`, x))
    .publishReplay(1).refCount()
}