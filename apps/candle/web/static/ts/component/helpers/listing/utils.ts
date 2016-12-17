import moment = require('moment')
import {RRule, RRuleSet} from 'rrule'

import {
  EventTypes, MetaPropertyTypes, EventTypeToProperties,
  DayOfWeek, RecurrenceFrequency, ListingTypes, CategoryTypes,
  PerformerSignupOptions, PreRegistrationOptions, PerformerLimitOptions,
  StageTimeOptions, TierPerkOptions, MinutesTypeOptions, RelativeTimeOptions,
  CostOptions, PurchaseTypeOptions
} from '../../../listingTypes'

export {
  EventTypes, MetaPropertyTypes, EventTypeToProperties,
  DayOfWeek, RecurrenceFrequency, ListingTypes, CategoryTypes,
  PerformerSignupOptions, PreRegistrationOptions, PerformerLimitOptions,
  StageTimeOptions, TierPerkOptions, MinutesTypeOptions, RelativeTimeOptions,
  CostOptions, PurchaseTypeOptions
} 

function inflateCuandoDates(container) {
  const {rrule, rdate, exdate} = container

  if (rrule && rrule.dtstart) {
    container.rrule.dtstart = moment(rrule.dtstart)
  }

  if (rrule && rrule.until) {
    container.rrule.until = moment(rrule.until)
  }
  
  if (rdate.length) {
    container.rdate = container.rdate.map(x => moment(x))
  }

  if (exdate.length) {
    container.exdate = container.exdate.map(x => moment(x))
  }
}

function deflateCuandoDates(container) {
  const {rrule, rdate, exdate} = container

  if (rrule && rrule.dtstart) {
    container.rrule.dtstart = rrule.dtstart.toDate().toISOString()
  }

  if (rrule && rrule.until) {
    container.rrule.until = rrule.until.toDate().toISOString()
  }  

  if (rdate && rdate.length) {
    container.rdate = container.rdate.map(x => x.toDate().toISOString())
  }

  if (exdate && exdate.length) {
    container.exdate = container.exdate.map(x => x.toDate().toISOString())
  }
}

export function inflateDates(session) {
  //console.log(`inflateDates`, session)
  const {properties, listing} = session
  const {type} = listing


  if (type === ListingTypes.RECURRING) {
    if (session.listing.cuando) { inflateCuandoDates(session.listing.cuando) }
    if (session.properties.recurrence) { inflateCuandoDates(session.properties.recurrence) }
  } else {
    if (session.listing.cuando) {
      const {begins, ends} = listing.cuando
      if (begins) { session.listing.cuando.begins = moment(begins) }
      if (ends) { session.listing.cuando.ends = moment(ends) }
    }
  }

  return session
}

export function deflateDates(session) {
  const {properties, listing} = session
  const {type} = listing

  if (type === ListingTypes.RECURRING) {
    if (listing.cuando) { deflateCuandoDates(session.listing.cuando) }
    if (properties.recurrence) { deflateCuandoDates(session.properties.recurrence) }
  } else {
    if (listing.cuando) {
      const {begins, ends} = listing.cuando
      if (begins) { session.listing.cuando.begins = begins.toDate().toISOString() }
      if (ends) { session.listing.cuando.ends = ends.toDate().toISOString() }
    }
  }

  return session
}

export function getSessionStream(sources) {
  return sources.Router.history$
    .map(x => x.state.data)
    .map(inflateDates)
}

export function fromCheckbox(ev) {
  const checked = ev.target.checked
  return {
    value: ev.target.value,
    checked
  }
}


function dayToRRuleDay(day) {
  switch (day) {
    case DayOfWeek.MONDAY:
      return RRule.MO
    case DayOfWeek.TUESDAY:
      return RRule.TU
    case DayOfWeek.WEDNESDAY:
      return RRule.WE
    case DayOfWeek.THURSDAY:
      return RRule.TH
    case DayOfWeek.FRIDAY:
      return RRule.FR
    case DayOfWeek.SATURDAY:
      return RRule.SA
    case DayOfWeek.SUNDAY:
      return RRule.SU
    default:
      throw new Error(`Invalid day`)
  }
}

function freqToRRuleFreq(freq) {
  switch (freq) {
    case RecurrenceFrequency.WEEKLY:
      return RRule.WEEKLY
    case RecurrenceFrequency.MONTHLY:
      return RRule.MONTHLY
    case RecurrenceFrequency.DAILY:
      return RRule.DAILY
    default:
      throw new Error(`Invalid freq`)
  }
}

export function getActualRRule(rrule) {
  const options = {
    ...rrule,
    freq: freqToRRuleFreq(rrule.freq),
    interval: rrule.interval || 1,
    byweekday: rrule.byweekday.map(dayToRRuleDay),
    dtstart: rrule.dtstart.toDate(),
    until: rrule.until ? rrule.until.clone().endOf('day').toDate() : undefined
  }
  //console.log(`rrule options`, options)
  return new RRule(options)
}

export function recurrenceToRRuleSet(cuando) {
  const {rrule, rdate, exdate} = cuando
  const rruleset = new RRuleSet()
  //console.log(`rrule`, rrule)
  if (rrule) {
    const the_rule = getActualRRule(rrule)
    rruleset.rrule(the_rule)
  }

  if (rdate.length) {
    rdate.forEach(x => {
      return rruleset.rdate(x.toDate())
    })
  } 

  if (exdate.length) {
    exdate.forEach(x => {
      return rruleset.exdate(x.toDate())
    })
  }

  //console.log(`rruleset`, JSON.stringify(rruleset))
  return rruleset
}