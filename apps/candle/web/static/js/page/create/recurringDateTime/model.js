import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {RRule, RRuleSet, rrulestr} from 'rrule'
import {combineObj} from '../../../utils'
//import {validateTime as isValid} from '../listing'


function isValid(listing) {
  const {rrule, rdate, exdate, exrule} = listing.profile.time
  const {freq, dtstart, until} = rrule

  return !!(freq && dtstart)
}

function reducers(actions, inputs) {
  const showModalR = actions.showModal$
    .map(val => state => {
      return state.set(`modal`, val)
    })

  const hideModalR = inputs.hideModal$
    .map(show => state => {
      return state.set(`modal`, undefined)
    })

  const frequencyR = inputs.frequency$.skip(1).map(val => state => {
    console.log(`blah`)
    const listing = state.get(`listing`)
    const rrule = listing.profile.time.rrule
    rrule.freq = parseInt(val)
    const valid = isValid(listing)
    return state.set(`listing`, listing).set(`valid`, valid)
  })

  const inputR = inputs.modalResult$.map(val => state => {
    const listing = state.get(`listing`)
    const modal = state.get(`modal`)

    if (modal === `startDate`)
      listing.profile.time.startDate = val
    else if (modal === `untilDate`)
      listing.profile.time.until = val
    else if (modal === `startTime`)
      listing.profile.time.startTime = val
    else if (modal === `endTime`)
      listing.profile.time.endTime = val
    else
      throw new Error(`invalid modal setting when given input`)

    const valid = isValid(listing)
    return state.set(`listing`, listing).set(`valid`, valid).set(`modal`, undefined)
  })


  // const endDateTimeR = inputs.endDateTime$.skip(1).map(val => state => {
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
    showModalR,
    hideModalR,
    frequencyR,
    inputR//,
    // endDateTimeR,
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
          startDate: undefined,
          until: undefined,
          startTime: undefined,
          endTime: undefined,
          rrule: {
            freq: undefined,
            dtstart: undefined,
            interval: undefined,
            wkst: undefined,
            count: undefined,
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
        valid: isValid(listing),
        modal: undefined
      }

      return reducer$.startWith(Immutable.Map(initial)).scan((acc, mod) => mod(acc))
    })
    .map(x => x.toJS())
    .do(x => console.log(`recurrence state...`, x))
    .publishReplay(1).refCount()

}
