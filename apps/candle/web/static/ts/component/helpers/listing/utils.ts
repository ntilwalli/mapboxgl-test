import moment = require('moment')
import {RRule, RRuleSet} from 'rrule'
import {getDatetimeFromObj} from '../../../helpers/time'

import {
  EventTypes, MetaPropertyTypes, EventTypeToProperties,
  DayOfWeek, RecurrenceFrequency, ListingTypes, CategoryTypes,
  PerformerSignupOptions, PreRegistrationOptions, PerformerLimitOptions,
  StageTimeOptions, TierPerkOptions, MinutesTypeOptions, RelativeTimeOptions,
  CostOptions, PurchaseTypeOptions, UndefinedOption
} from '../../../listingTypes'

export {
  EventTypes, MetaPropertyTypes, EventTypeToProperties,
  DayOfWeek, RecurrenceFrequency, ListingTypes, CategoryTypes,
  PerformerSignupOptions, PreRegistrationOptions, PerformerLimitOptions,
  StageTimeOptions, TierPerkOptions, MinutesTypeOptions, RelativeTimeOptions,
  CostOptions, PurchaseTypeOptions, UndefinedOption
} 

function inflateRecurringCuandoDates(container) {
  const {rrules, rdate, exdate} = container

  if (rrules && rrules.length) {
    rrules.forEach(rule => {
      if (rule && rule.dtstart) {
        rule.dtstart = moment(rule.dtstart)
      }

      if (rule && rule.until) {
        rule.until = moment(rule.until)
      }
    })
  }
  
  if (rdate && rdate.length) {
    container.rdate = container.rdate.map(x => moment(x))
  }

  if (exdate && exdate.length) {
    container.exdate = container.exdate.map(x => moment(x))
  }
}

function deflateRecurringCuandoDates(container) {
  const {rrules, rdate, exdate} = container

  if (rrules && rrules.length) {
    rrules.forEach(rule => {
      if (rule && rule.dtstart) {
        rule.dtstart = rule.dtstart.toDate().toISOString()
      }

      if (rule && rule.until) {
        rule.until = rule.until.toDate().toISOString()
      }
    })
  }

  if (rdate && rdate.length) {
    container.rdate = container.rdate.map(x => x.toDate().toISOString())
  }

  if (exdate && exdate.length) {
    container.exdate = container.exdate.map(x => x.toDate().toISOString())
  }
}

export function inflateListing(listing) {

  const {type} = listing


  if (type === ListingTypes.RECURRING) {
    if (listing.cuando) { inflateRecurringCuandoDates(listing.cuando) }
  } else {
    if (listing.cuando) {
      const {begins, ends} = listing.cuando
      if (begins) { listing.cuando.begins = moment(begins) }
      if (ends) { listing.cuando.ends = moment(ends) }
    }
  }

  return listing
}


export function deflateListing(listing) {
  const {type} = listing

  if (type === ListingTypes.RECURRING) {
    if (listing.cuando) { deflateRecurringCuandoDates(listing.cuando) }
  } else {
    if (listing.cuando) {
      const {begins, ends} = listing.cuando
      if (begins) { listing.cuando.begins = begins.toDate().toISOString() }
      if (ends) { listing.cuando.ends = ends.toDate().toISOString() }
    }
  }

  return listing
}




export function inflateDates(session) {
  //console.log(`inflateDates`, session)
  const {properties, listing} = session
  const {type} = listing


  if (type === ListingTypes.RECURRING) {
    if (session.listing.cuando) { inflateRecurringCuandoDates(session.listing.cuando) }
    if (session.properties.recurrence) { inflateRecurringCuandoDates(session.properties.recurrence) }
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
    if (listing.cuando) { deflateRecurringCuandoDates(session.listing.cuando) }
    if (properties.recurrence) { deflateRecurringCuandoDates(session.properties.recurrence) }
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

export function getActualRRule(rule) {
  const options = {
    wkst: rule.wkst ? dayToRRuleDay(rule.wkst) : RRule.MO,
    freq: freqToRRuleFreq(rule.freq),
    interval: rule.interval || 1,
    byweekday: rule.byweekday ? rule.byweekday.map(dayToRRuleDay) : [RRule.MO],
    bysetpos: rule.bysetpos, 
    dtstart: rule.dtstart.toDate(),
    until: rule.until ? rule.until.clone().endOf('day').toDate() : null,
  }
  //console.log(`rrule options`, options)
  const out = new RRule(options)
  //const blah = out.between(moment().toDate(), moment().add(30, 'day').toDate())
  return out
}

export function recurrenceToRRuleSet(recurrence) {
  const {rules, rdates, exdates, start_date, end_date, start_time} = recurrence
  const rruleset = new RRuleSet()
  //console.log(`rrule`, rrule)
  if (rules.length) {
    rules.map(fromRule).map(r => normalizeRule(r, start_date, end_date, start_time)).forEach(rrule => {
      const the_rule = getActualRRule(rrule)
      rruleset.rrule(the_rule)
    })
  }

  if (rdates && rdates.length) {
    rdates.forEach(x => {
      return rruleset.rdate(x.toDate())
    })
  } 

  if (exdates && exdates.length) {
    exdates.forEach(x => {
      return rruleset.exdate(x.toDate())
    })
  }

  //console.log(`rruleset`, JSON.stringify(rruleset))
  return rruleset
}

export function cuandoToRRuleSet(cuando) {
  const {rrules, rdates, exdates} = cuando
  const rruleset = new RRuleSet()
  //console.log(`rrule`, rrule)
  if (rrules.length) {
    rrules.forEach(rrule => {
      const the_rule = getActualRRule(rrule)
      rruleset.rrule(the_rule)
    })
  }

  if (rdates && rdates.length) {
    rdates.forEach(x => {
      return rruleset.rdate(x.toDate())
    })
  } 

  if (exdates && exdates.length) {
    exdates.forEach(x => {
      return rruleset.exdate(x.toDate())
    })
  }

  //console.log(`rruleset`, JSON.stringify(rruleset))
  return rruleset
}

export function normalizeRule(rule, start_date, end_date, start_time) {
  return {
    wkst: rule.wkst || DayOfWeek.MONDAY,
    freq: rule.freq || RecurrenceFrequency.WEEKLY,
    interval: rule.interval || 1,
    bysetpos: Array.isArray(rule.bysetpos) && rule.bysetpos.length ? rule.bysetpos : rule.bysetpos ? [rule.bysetpos] : null,
    byweekday: Array.isArray(rule.byweekday) && rule.byweekday.length ? rule.byweekday : rule.byweekday ? [rule.bysetpos] : null,
    dtstart: getDatetimeFromObj(start_date, start_time),
    until: end_date ? getDatetimeFromObj(end_date, start_time) : null
  }
}

export function fromRule(rule) {
  return {
    freq: rule.type,
    byweekday: Array.isArray(rule.data.day) && rule.data.day.length ? rule.data.day : rule.data.day ? [rule.data.day] : null,
    bysetpos: Array.isArray(rule.data.setpos) && rule.data.setpos.length ? rule.data.setpos : rule.data.setpos ? [rule.data.setpos] : null,
    interval: !!rule.data.interval ? rule.data.interval : null
  }
}

export function toRule(rule) {
  return {
    type: rule.freq,
    data: {
      day: Array.isArray(rule.byweekday) && rule.byweekday.length ? rule.byweekday : rule.byweekday ? [rule.byweekday] : null,
      setpos: Array.isArray(rule.bysetpos) && rule.bysetpos.length ? rule.bysetpos : rule.bysetpos ? [rule.bysetpos] : null,
      interval: rule.interval || 1
    }
  }
}