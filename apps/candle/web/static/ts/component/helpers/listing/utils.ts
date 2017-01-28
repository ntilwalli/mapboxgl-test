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

import {getDefault as getContactInfoDefault} from '../../create/newListing/advanced/contactInfo/main'
import {getDefault as getFullTierCostDefault} from '../../create/newListing/advanced/fullTierCost/main'
import {getDefault as getCostDefault} from '../../create/newListing/advanced/cost/main'
import {getDefault as getPerformerCheckinDefault} from '../../create/newListing/advanced/togglePerformerCheckIn/main'
import {getDefault as getPerformerSignupDefault} from '../../create/newListing/advanced/performerSignUp/main'
import {getDefault as getPerformerLimitDefault} from '../../create/newListing/advanced/performerLimit/main'
import {getDefault as getStageTimeRoundDefault} from '../../create/newListing/advanced/stageTimeRound/main'

export {
  EventTypes, MetaPropertyTypes, EventTypeToProperties,
  DayOfWeek, RecurrenceFrequency, ListingTypes, CategoryTypes,
  PerformerSignupOptions, PreRegistrationOptions, PerformerLimitOptions,
  StageTimeOptions, TierPerkOptions, MinutesTypeOptions, RelativeTimeOptions,
  CostOptions, PurchaseTypeOptions, UndefinedOption
} 


export const getListedHostsDefault = () => []
export const getListedPerformersDefault = () => []
export const getNotesDefault = () => undefined
export const getPerformerCostDefault = () => [getFullTierCostDefault()]
export const getStageTimeDefault = () => [getStageTimeRoundDefault()]
export const getCategoriesDefault = () => [CategoryTypes.COMEDY]
export const getEventTypesDefault = () => [EventTypes.OPEN_MIC]
export const getNameDefault = () => undefined
export const getDescriptionDefault = () => undefined

export const metaPropertyToDefaultFunction = {}
metaPropertyToDefaultFunction[MetaPropertyTypes.PERFORMER_SIGN_UP] = getPerformerSignupDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.PERFORMER_CHECK_IN] = getPerformerCheckinDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.PERFORMER_COST] = () => getPerformerCostDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.STAGE_TIME] = () => getStageTimeDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.PERFORMER_LIMIT] = getPerformerLimitDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.NOTES] = getNotesDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.LISTED_HOSTS] = getListedHostsDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.CONTACT_INFO] = getContactInfoDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.LISTED_PERFORMERS] = getListedPerformersDefault
metaPropertyToDefaultFunction[MetaPropertyTypes.AUDIENCE_COST] = getCostDefault
metaPropertyToDefaultFunction['name'] = getNameDefault
metaPropertyToDefaultFunction['description'] = getDescriptionDefault
metaPropertyToDefaultFunction['categories'] = getCategoriesDefault
metaPropertyToDefaultFunction['event_types'] = getEventTypesDefault



function addOpenMicDefaults(out) {
  out[MetaPropertyTypes.PERFORMER_SIGN_UP] = getPerformerSignupDefault()
  out[MetaPropertyTypes.PERFORMER_CHECK_IN] = getPerformerCheckinDefault()
  out[MetaPropertyTypes.PERFORMER_COST] = getPerformerCostDefault()
  out[MetaPropertyTypes.STAGE_TIME] = getStageTimeDefault()
  out[MetaPropertyTypes.PERFORMER_LIMIT] = getPerformerLimitDefault()
  out[MetaPropertyTypes.NOTES] = getNotesDefault()
  out[MetaPropertyTypes.LISTED_HOSTS] = getListedHostsDefault()
  out[MetaPropertyTypes.CONTACT_INFO] = getContactInfoDefault()

  return out
}

function addShowDefaults(out) {
  out[MetaPropertyTypes.NOTES] = getNotesDefault()
  out[MetaPropertyTypes.LISTED_HOSTS] = getListedHostsDefault()
  out[MetaPropertyTypes.LISTED_PERFORMERS] = getListedPerformersDefault()
  out[MetaPropertyTypes.CONTACT_INFO] = getContactInfoDefault()
  out[MetaPropertyTypes.AUDIENCE_COST] = getCostDefault()

  return out
}

function getDefaultListingMeta() {
  const out = {}
  out['event_types'] = getEventTypesDefault()
  out['name'] = getNameDefault()
  out['categories'] = getCategoriesDefault()
  out['description'] = getDescriptionDefault()
  addOpenMicDefaults(out)
  return out
}

function getDefaultListingType() { return 'single' }
function getDefaultListingDonde() { return undefined }
function getDefaultListingCuando() { 
  return {
    begins: undefined,
    ends: undefined
  }
}

function getDefaultListingSettings() {
  return {
    check_in: {
      begins: {
        type: "minutes_before_event_start",
        data: {
          minutes: 30
        }
      },
      ends: {
        type: "event_end"
      },
      radius: 30
    }
  }
}

function getDefaultListing() {
  return {
    type: getDefaultListingType(),
    donde: getDefaultListingDonde(),
    cuando: getDefaultListingCuando(),
    settings: getDefaultListingSettings(),
    meta: getDefaultListingMeta()
  }
}

function getDefaultSearchArea() {
  return undefined
}

export function getDefaultDate() {
  return moment().startOf('day')
}


export function getEmptyRecurrence() {
  return {
    start_date: getDefaultDate(), 
    end_date: undefined, 
    rules: [],
    rdates: [], 
    exdates: []
  }
}

function getDefaultTimes() {
  return {
    start_time: {
      hour: 20,
      minute: 0
    },
    end_time: {
      hour: 22,
      minute: 0
    }
  }
}

function getDefaultSessionProperties() {
  return {
    donde: {
      modal: undefined,
      search_area: getDefaultSearchArea()
    },
    cuando: {
      recurrence: getEmptyRecurrence(),
      date: getDefaultDate(),
      ...getDefaultTimes()
    }
  }
}

export function getDefaultSession(retrieved_session = {}) {
  return {
    ...retrieved_session,
    current_step: 'basics',
    listing: getDefaultListing(),
    properties: getDefaultSessionProperties()
  }
}


function inflateRecurrence(recurrence) {
  const {start_date, end_date, rdates, exdates} = recurrence

  if (start_date) {
    recurrence.start_date = moment(start_date)
  }

  if (end_date) {
    recurrence.end_date = moment(end_date)
  }

  
  if (rdates && rdates.length) {
    recurrence.rdate = recurrence.rdates.map(x => moment(x))
  }

  if (exdates && exdates.length) {
    recurrence.exdates = recurrence.exdates.map(x => moment(x))
  }
}

function deflateRecurrence(recurrence) {
  const {start_date, end_date, rdates, exdates} = recurrence

  if (start_date) {
    recurrence.start_date = start_date.toDate().toISOString()
  }

  if (end_date) {
    recurrence.end_date = end_date.toDate().toISOString()
  }

  if (rdates && rdates.length) {
    recurrence.rdates = recurrence.rdate.map(x => x.toDate().toISOString())
  }

  if (exdates && exdates.length) {
    recurrence.exdates = recurrence.exdate.map(x => x.toDate().toISOString())
  }
}

function inflateCuando(container) {
  const {rrules, rdates, exdates} = container

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
  
  if (rdates && rdates.length) {
    container.rdates = container.rdates.map(x => moment(x))
  }

  if (exdates && exdates.length) {
    container.exdates = container.exdates.map(x => moment(x))
  }
}

function deflateCuando(container) {
  const {rrules, rdates, exdates} = container

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

  if (rdates && rdates.length) {
    container.rdates = container.rdates.map(x => x.toDate().toISOString())
  }

  if (exdates && exdates.length) {
    container.exdates = container.exdates.map(x => x.toDate().toISOString())
  }
}

export function inflateListing(listing) {

  const {type} = listing


  if (type === ListingTypes.RECURRING) {
    if (listing.cuando) { inflateCuando(listing.cuando) }
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
    if (listing.cuando) { deflateCuando(listing.cuando) }
  } else {
    if (listing.cuando) {
      const {begins, ends} = listing.cuando
      if (begins) { listing.cuando.begins = begins.toDate().toISOString() }
      if (ends) { listing.cuando.ends = ends.toDate().toISOString() }
    }
  }

  return listing
}




export function inflateSession(session) {
  const {properties, listing, inserted_at, updated_at} = session
  if (properties && listing) {
    const {type} = listing

    if (session.properties.cuando.date) {
      session.properties.cuando.date = moment(session.properties.cuando.date)
    }

    if (session.properties.cuando.recurrence) {
      inflateRecurrence(session.properties.cuando.recurrence) 
    }

    if (type === ListingTypes.RECURRING) {
      if (session.listing.cuando) { 
        inflateCuando(session.listing.cuando) 
      }
      if (session.properties.cuando.recurrence) {
        inflateRecurrence(session.properties.cuando.recurrence) 
      }
    } else {
      if (session.listing.cuando) {
        const {begins, ends} = listing.cuando
        if (begins) { session.listing.cuando.begins = moment(begins) }
        if (ends) { session.listing.cuando.ends = moment(ends) }
      }
    }
  }

  if (inserted_at) {
    session.inserted_at = moment(session.inserted_at)
  }

  if (updated_at) {
    session.updated_at = moment(session.updated_at)
  }

  return session
}

export function deflateSession(session) {
  const {properties, listing, inserted_at, updated_at} = session
  if (properties && listing) {
    const {type} = listing

    if (properties.cuando.date) {
      properties.cuando.date = properties.cuando.date.toDate().toISOString()
    }

    if (properties.cuando.recurrence) { deflateRecurrence(properties.cuando.recurrence) }

    if (type === ListingTypes.RECURRING) {
      if (listing.cuando) { deflateCuando(session.listing.cuando) }
    } else {
      if (listing.cuando) {
        const {begins, ends} = listing.cuando
        if (begins) { listing.cuando.begins = begins.toDate().toISOString() }
        if (ends) { listing.cuando.ends = ends.toDate().toISOString() }
      }
    }
  }
  
  if (inserted_at) {
    session.inserted_at = inserted_at.toDate().toISOString()
  }

  if (updated_at) {
    session.updated_at = updated_at.toDate().toISOString()
  }

  return session
}

export function getSessionStream(sources) {
  return sources.Router.history$
    .map(x => x.state.data)
    .map(inflateSession)
}

export function has(arr, type) {
  return arr.some(val => val === type)
}

export function fromCheckbox(ev) {
  const checked = ev.target.checked
  return {
    value: ev.target.value,
    checked
  }
}

export function processCheckboxArray(msg, arr) {
  const {type, data} = msg
  const index = arr.indexOf(msg.value)
  if (index >= 0) {
    arr.splice(index, 1)
  } else {
    arr.push(msg.value)
  }

  return arr
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