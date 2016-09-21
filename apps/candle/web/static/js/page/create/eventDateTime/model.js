import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj} from '../../../utils'
import {validateTime as isValid} from '../listing'

function reducers(actions, inputs) {
  const startDateR = inputs.startDate$.skip(1).map(val => state => {
    const listing = state.get(`listing`)
    listing.profile.time.start = {
      type: `datetime`,
      data: val
    }
    return state.set(`listing`, listing).set(`valid`, isValid(listing))
  })

  const endDateR = inputs.endDate$.skip(1).map(val => state => {
    const listing = state.get(`listing`)
    listing.profile.time.end = {
      type: `datetime`,
      data: val
    }
    return state.set(`listing`, listing).set(`valid`, isValid(listing))
  })

  return O.merge(
    startDateR,
    endDateR
  )
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.listing$.take(1)
    .switchMap(listing => {
      const {profile} = listing
      const {time} = profile
      profile.time = time || {
        start: undefined,
        end: undefined
      }
      const initial = {
        listing: listing,
        valid: isValid(listing),
        errors: [],
        showPicker: false
      }

      return reducer$.startWith(Immutable.Map(initial)).scan((acc, mod) => mod(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`eventDateTime state...`, x))
    .publishReplay(1).refCount()

}