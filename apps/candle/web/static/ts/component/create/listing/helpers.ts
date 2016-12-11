import moment = require('moment')

export const EventTypeToProperties = {
  'open-mic': ['performer_signup', 'check_in', 'performer_cost', 'stage_time', 'performer_limit', 'listed_hosts', 'notes'],
  'show': ['listed_hosts', 'listed_performers', 'check_in', 'audience_cost']
}

export const PerformerSignupOptions = {
  IN_PERSON: 'in_person',
  PRE_REGISTRATION: 'pre-registration',
  IN_PERSON_AND_PRE_REGISTRATION: 'in-person-and-pre-registration'
}

export const PerformerLimitOptions = {
  NO_LIMIT: 'no-limit',
  LIMIT: 'limit',
  LIMIT_BY_SIGNUP_TYPE: 'limit-by-signup-type'
}

export const StageTimeOptions = {
  MINUTES: 'in-minutes',
  SONGS: 'in-songs',
  MINUTES_OR_SONGS: 'in-minutes-or-songs'
}

export const MinutesTypeOptions = {
  MAX: 'max',
  RANGE: 'range'
}

export const RelativeTimeOptions = {
  //BLANK: 'blank',
  UPON_POSTING: 'upon-posting',
  DAYS_BEFORE_EVENT_START: 'days-before-event-start',
  MINUTES_BEFORE_EVENT_START: 'minutes-before-event-start',
  PREVIOUS_WEEKDAY_AT_TIME: 'previous-weekday-at-time',
  EVENT_START: 'event-start',
  MINUTES_AFTER_EVENT_START: 'minutes-after-event-start',
  MINUTES_BEFORE_EVENT_END: 'minutes-before-event-end',
  EVENT_END: 'event-end'
}

export const CostOptions = {
  FREE: 'free',
  COVER: 'cover',
  MINIMUM_PURCHASE: 'minimum-purchase',
  COVER_AND_MINIMUM_PURCHASE: 'cover-and-minimum-purchase',
  COVER_OR_MINIMUM_PURCHASE: 'cover-or-minimum-purchase',
}

export const PurchaseTypeOptions = {
  DRINK: 'drink',
  ITEM: 'item',
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


  if (type === `recurring`) {
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

  if (type === `recurring`) {
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