import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, traceStartStop} from '../../../utils'
import {validateMeta as isValid} from '../listing'


function setValidity(state) {
  const session = state.get(`session`)
  const {listing} = session
  return state.set(`valid`, isValid(listing))
}

function reducers(actions, inputs) {
  const creationTypeR = inputs.creationType$.map(val => state => {
    const session = state.get(`session`)
    const {listing} = session
    listing.type = val
    if (val === `group`) {
      const profile = listing.profile
      profile.event_types = undefined
    }

    listing.profile.time = undefined
    return state.set(`session`, session).set(`valid`, isValid(listing))
  })

  const visibilityR = inputs.visibility$.map(val => state => {
    const session = state.get(`session`)
    const {listing} = session
    listing.visibility = val

    return state.set(`session`, session).set(`valid`, isValid(listing))
  })

  const eventTypeR = inputs.eventType$.map(val => state => {
    const session = state.get(`session`)
    const {listing} = session
    const {profile} = listing
    profile.event_types = [val]

    return state.set(`session`, session).set(`valid`, isValid(listing))
  })

  return O.merge(
    creationTypeR,
    visibilityR,
    eventTypeR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return actions.session$
    .map(x => {
      return x
    })
    .map((session: any) => {
      const valid = isValid(session.listing)
      return {
        waiting: false,
        session,
        valid
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, mod: Function) => mod(acc)))
    .map(x => (<any> x).toJS())
    .letBind(traceStartStop(`state$`))
    .publishReplay(1).refCount()

}
