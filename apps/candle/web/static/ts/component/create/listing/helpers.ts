import moment = require('moment')
import {RRule, RRuleSet} from 'rrule'

export const EventTypes = {
  OPEN_MIC: 'open_mic',
  SHOW: 'show'
}

export const MetaPropertyTypes = {
  PERFORMER_SIGN_UP: 'performer_sign_up',
  CHECK_IN: 'check_in',
  PERFORMER_COST: 'performer_cost',
  STAGE_TIME: 'stage_time',
  PERFORMER_LIMIT: 'performer_limit', 
  LISTED_HOSTS: 'listed_hosts',
  NOTES: 'notes', 
  CONTACT_INFO: 'contact_info',
  AUDIENCE_COST: 'audience_cost',
  LISTED_PERFORMERS: 'listed_performers'
}

export const EventTypeToProperties = {
  open_mic: [
    MetaPropertyTypes.PERFORMER_SIGN_UP, 
    MetaPropertyTypes.CHECK_IN,
    MetaPropertyTypes.PERFORMER_COST,
    MetaPropertyTypes.STAGE_TIME,
    MetaPropertyTypes.PERFORMER_LIMIT,
    MetaPropertyTypes.LISTED_HOSTS,
    MetaPropertyTypes.NOTES,
    MetaPropertyTypes.CONTACT_INFO
  ],
  show: [
    MetaPropertyTypes.LISTED_HOSTS,
    MetaPropertyTypes.LISTED_PERFORMERS,
    MetaPropertyTypes.CHECK_IN, 
    MetaPropertyTypes.AUDIENCE_COST,
    MetaPropertyTypes.CONTACT_INFO
  ]
}

export const DayOfWeek = {
  SUNDAY: 'sunday',
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday'
}

export const RecurrenceFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
}

export const ListingTypes = {
  SINGLE: 'single',
  RECURRING: 'recurring'
}



export const CategoryTypes = {
  COMEDY: 'comedy',
  MUSIC: 'music',
  POETRY: 'poetry',
  STORYTELLING: 'storytelling'
}

export const PerformerSignupOptions = {
  NOT_SPECIFIED: 'not_specified',
  IN_PERSON: 'in_person',
  PRE_REGISTRATION: 'pre_registration',
  IN_PERSON_AND_PRE_REGISTRATION: 'in_person_and_pre_registration'
}

export const PerformerLimitOptions = {
  NOT_SPECIFIED: 'not_specified',
  NO_LIMIT: 'no_limit',
  LIMIT: 'limit',
  LIMIT_BY_SIGN_UP_TYPE: 'limit_by_sign_up_type'
}

export const StageTimeOptions = {
  NOT_SPECIFIED: 'not_specified',
  MINUTES: 'minutes',
  SONGS: 'songs',
  MINUTES_OR_SONGS: 'minutes_or_songs'
}

export const TierPerkOptions = {
  NO_PERK: 'no_perk',
  ADDITIONAL_MINUTES_AND_PRIORITY_ORDER: 'additional_minutes_and_priority_order',
  MINUTES_AND_PRIORITY_ORDER: 'minutes_and_priority_order',
  ADDITIONAL_SONGS_AND_PRIORITY_ORDER: 'additional_songs_and_priority_order',
  SONGS_AND_PRIORITY_ORDER: 'songs_and_priority_order',
  MINUTES: 'minutes',
  SONGS: 'songs',
  PRIORITY_ORDER: 'priority_order',
  ADDITIONAL_BUCKET_ENTRY: 'additional_bucket_entry'
}

export const MinutesTypeOptions = {
  MAX: 'max',
  RANGE: 'range'
}

export const RelativeTimeOptions = {
  NOT_SPECIFIED: 'not_specified',
  UPON_POSTING: 'upon_posting',
  DAYS_BEFORE_EVENT_START: 'days_before_event_start',
  MINUTES_BEFORE_EVENT_START: 'minutes_before_event_start',
  PREVIOUS_WEEKDAY_AT_TIME: 'previous_weekday_at_time',
  EVENT_START: 'event_start',
  MINUTES_AFTER_EVENT_START: 'minutes_after_event_start',
  MINUTES_BEFORE_EVENT_END: 'minutes_before_event_end',
  EVENT_END: 'event_end'
}

export const CostOptions = {
  FREE: 'free',
  COVER: 'cover',
  MINIMUM_PURCHASE: 'minimum_purchase',
  COVER_AND_MINIMUM_PURCHASE: 'cover_and_minimum_purchase',
  COVER_OR_MINIMUM_PURCHASE: 'cover_or_minimum_purchase',
  PAID: 'paid',
  SEE_NOTES: 'see_notes'
}

export const PurchaseTypeOptions = {
  DRINK: 'drink',
  ITEM: 'item',
  DRINK_OR_ITEM: 'drink_or_item',
  DOLLARS: 'dollars'
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