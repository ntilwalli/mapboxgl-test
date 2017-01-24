import {inflateSession, fromRule, toRule, normalizeRule} from '../../../../helpers/listing/utils'
import {getDatetimeFromObj} from '../../../../../helpers/time'
import {ListingTypes} from '../../../../../listingTypes'
import moment = require('moment')

function getDuration(start_time, end_time) {
  const base = moment([2010, 1])
  const start = getDatetimeFromObj(base.clone(), start_time)
  let end = getDatetimeFromObj(base.clone(), end_time)
  
  if (end.isBefore(start)) {
    end = getDatetimeFromObj(base.clone().add(1, 'day'), end_time)
  }

  return end.diff(start, 'minutes');
}

export function applySingleCuando(session) {
  const {properties, listing} = session
  const {start_time, end_time, date} = properties.cuando
  
  session.listing.type = ListingTypes.SINGLE

  if (date && start_time) { 
    if (!session.listing.cuando) {
      session.listing.cuando = {begins: undefined, ends: undefined}
    }
    const start_date_time = getDatetimeFromObj(date, start_time)
    session.listing.cuando.begins = start_date_time

    if (end_time) {
      const end_date_time = getDatetimeFromObj(date, end_time)
      
      if (end_date_time.isSameOrBefore(start_date_time)) {
        session.listing.cuando.ends = end_date_time.add(1, 'day')
      }
      
      session.listing.cuando.ends = end_date_time
    } 
  } else {
    session.listing.cuando = {begins: undefined, ends: undefined}
  }
}

export function applyRecurringCuando(session) {
  const {properties, listing} = session
  const {cuando} = properties
  const {recurrence, start_time, end_time} = cuando
  const {start_date, end_date, rules, rdates, exdates} = recurrence

  session.listing.type = ListingTypes.RECURRING

  if (rules.length && start_time) {
    listing.cuando.rrules = rules.map(fromRule).map(rule => {
      const n_rule = normalizeRule(rule, start_date, end_date, start_time)
      return n_rule
    })
  } else {
    listing.cuando.rrules = []
  }

  if (rdates.length && start_time) {
    listing.cuando.rdates = rdates.map(rdate => getDatetimeFromObj(rdate, start_time))
  } else {
    listing.cuando.rdates = []
  }

  if (exdates.length && start_time) {
    listing.cuando.exdates = exdates.map(exdate => getDatetimeFromObj(exdate, start_time))
  } else {
    listing.cuando.exdates = []
  }

  if (start_time && end_time) {
    listing.cuando.duration = getDuration(start_time, end_time)
  }
}