import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {RRule, RRuleSet, rrulestr} from 'rrule'
import {combineObj} from '../../../utils'
//import {validateTime as isValid} from '../listing'


function isValid(listing) {
  const {rrule, rdate, exdate, exrule} = listing.profile.time
  const {freq, dtstart, until} = rrule

  return freq && dtstart
}

function reducers(actions, inputs) {
  const frequencyR = inputs.frequency$.skip(1).map(val => state => {
    console.log(`blah`)
    const listing = state.get(`listing`)
    const rrule = listing.profile.time.rrule
    rrule.freq = parseInt(val)
    const valid = isValid(listing)
    return state.set(`listing`, listing).set(`valid`, valid)
  })

  // const startDateR = inputs.startDate$.map(val => state => {
  //   const listing = state.get(`listing`)
  //   const rrule = state.get(`rrule`)
  //   rrule.dtstart = val
  //   const valid = checkValidity(state)
  //   return state.set(`rrule`, rrule).set(`valid`, valid)
  // })

  // const endDateR = inputs.endDate$.skip(1).map(val => state => {
  //   const listing = state.get(`listing`)
  //   const rrule = state.get(`rrule`)
  //   rrule.until = val
  //   const valid = checkValidity(state)
  //   return state.set(`rrule`, rrule).set(`valid`, valid)
  // })

  // const exclusionsR = inputs.exclusions$.map(val => state => {
  //   return state.set(`exdate`, val)
  // })

  // const additionsR = inputs.additions$.map(val => state => {
  //   return state.set(`rdate`, val)
  // })

  return O.merge(
    frequencyR
    // startDateR,
    // endDateR,
    // exclusionsR,
    // additionsR
  )
}




export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.listing$.take(1)
    .switchMap(listing => {
      const {profile} = listing
      const time = profile.time 
      if (!time) {
        listing.profile.time = {
          rrule: {
            freq: undefined,
            count: undefined,
            dtstart: undefined,
            dtend: undefined,
            wkst: undefined,
            until: undefined,
            bysetpos: undefined,
            bymonth: undefined,
            bymonthday: undefined,
            byyearday: undefined,
            byweekno: undefined,
            byweekday: undefined,
            byhour: undefined,
            byminute: undefined,
            bysecond: undefined
          },
          rdate: [],
          exdate: [],
          exrule: []
        }
      }

      const initial = {
        listing: listing,
        errors: [],
        valid: isValid(listing)
      }

      return reducer$.startWith(Immutable.Map(initial)).scan((acc, mod) => mod(acc))
    })
    .map(x => x.toJS())
    .do(x => console.log(`recurrence state...`, x))
    .publishReplay(1).refCount()

}
