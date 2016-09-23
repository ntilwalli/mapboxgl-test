import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import moment from 'moment'
import {RRule, RRuleSet, rrulestr} from 'rrule'
import {combineObj} from '../../../utils'
//import {validateTime as isValid} from '../listing'

function getMomentFromCurrentInfo(cd, ct) {
  if (cd && ct) {
    return moment({
      year: cd.year,
      month: cd.month,
      day: cd.date,
      hour: ct.hour === 12 ? 
              ct.mode === `P.M` ? 
                ct.hour 
                : 0 
              : ct.mode === `A.M.` ? 
                  ct.hour 
                  : ct.hour + 12
    })
  }

  return undefined
}

function getRRule(listing) {
  const {frequency, startDate, until, startTime, endTime} = listing.profile.time

  if (frequency && startDate && startTime) {
    return {
      freq: frequency,
      dtstart: getMomentFromCurrentInfo(startDate, startTime).toDate(),
      until: until ? getMomentFromCurrentInfo(until, endTime || startTime).toDate() : undefined
    }
  }

  return undefined
}

const isValid = rrule => !!rrule
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
    const listing = state.get(`listing`)
    listing.profile.time.frequency = parseInt(val)
    const rrule = getRRule(listing)
    const valid = isValid(rrule)
    listing.profile.time.rrule = getRRule(listing)

    let displayYear = state.get(`displayYear`)
    let displayMonth = state.get(`displayMonth`)
    if (valid) {
      const startDate = listing.profile.time.startDate
      displayYear = !displayYear ? startDate.year : displayYear
      displayMonth = !displayMonth ? startDate.month : displayMonth
    } else {
      displayYear = undefined
      displayMonth = undefined
    }

    return state
      .set(`listing`, listing)
      .set(`valid`, valid)
      .set(`displayYear`, displayYear)
      .set(`displayMonth`, displayMonth)
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
    
    const startDate = listing.profile.time.startDate
    const rrule = getRRule(listing)
    const valid = isValid(rrule)
    listing.profile.time.rrule = getRRule(listing)

    let displayYear = state.get(`displayYear`)
    let displayMonth = state.get(`displayMonth`)
    if (valid) {
      displayYear = !displayYear ? startDate.year : displayYear
      displayMonth = !displayMonth ? startDate.month : displayMonth
    } else {
      displayYear = undefined
      displayMonth = undefined
    }

    return state
      .set(`listing`, listing)
      .set(`valid`, valid)
      .set(`modal`, undefined)
      .set(`displayYear`, displayYear)
      .set(`displayMonth`, displayMonth)
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
          frequency: undefined,
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
        displayYear: undefined,
        displayMonth: undefined,
        errors: [],
        valid: isValid(getRRule(listing)),
        modal: undefined
      }

      return reducer$.startWith(Immutable.Map(initial)).scan((acc, mod) => mod(acc))
    })
    .map(x => x.toJS())
    .do(x => console.log(`recurrence state...`, x))
    .publishReplay(1).refCount()

}
