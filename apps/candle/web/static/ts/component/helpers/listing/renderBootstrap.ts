import {Observable as O} from 'rxjs'
import {div, a, pre, span, input, button, strong, h6, em, b, address, small} from '@cycle/dom'
import {combineObj} from '../../../utils'
import {to12HourTime} from '../../../helpers/time'
import {ListingTypes, EventTypes, PerformerSignupOptions, RelativeTimeOptions, CostOptions, TierPerkOptions, PurchaseTypeOptions, StageTimeOptions, MinutesTypeOptions, PerformerLimitOptions} from '../../../listingTypes'
import moment = require('moment')
import {recurrenceToRRuleSet} from './utils'
import {getBadslavaName, getVenueName, getVenueAddress, getVenueLngLat} from '../../../helpers/donde'

import deepEqual = require('deep-equal')


function getDondeSummary(donde) {
  if (donde.source === 'foursquare') {
    const {data} = donde
    const {name, location} = data
    return `Where: ${name}\nAddress: ${location.address}, ${location.city}, ${location.state} ${location.postalCode}`
  }
}

function getInPersonSummary(info) {
  return `  In-person: ${info.styles.join(',')}\n\
    Begins: ${getRelativeTimeInfo(info.begins)}\n\
    Ends: ${getRelativeTimeInfo(info.ends)}`
}

function getPreregistrationData(info) {
  switch(info.type) {
    case 'app':
      return '';
    case 'email':
      return `\t\tEmail: ${info.data}`
    case 'website':
      return `\t\tWebsite: ${info.data}`
  }
}

function getRelativeTimeInfo(info) {
  let val_string
  switch(info.type) {
    case RelativeTimeOptions.MINUTES_BEFORE_EVENT_START:
      return `${info.data.minutes} minutes before event start`
    case RelativeTimeOptions.MINUTES_AFTER_EVENT_START:
      return `${info.data.minutes} minutes after event start`
    case RelativeTimeOptions.MINUTES_BEFORE_EVENT_END:
      return `${info.data.minutes} minutes before event end`
    case RelativeTimeOptions.EVENT_START:
      return 'Event start'
    case RelativeTimeOptions.EVENT_END:
      return 'Event end'
    case RelativeTimeOptions.UPON_POSTING:
      return 'Upon posting'
    case RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME:
      const time = to12HourTime(info.data.time)
      return `Previous ${info.data.day} @ ${time.hour}:${time.minute} ${time.mode}`
  }
}

function getPreRegistrationSummary(info) {
  return `  Pre-registration: ${info.type === 'app' ? 'In-' : 'By '}${info.type}\
  ${getPreregistrationData(info)}\n\
    Begins: ${getRelativeTimeInfo(info.begins)}\n\
    Ends: ${getRelativeTimeInfo(info.ends)}`
}

function getPerformerSignupSummary(info) {
  let out = 'Performer sign-up: '
  const {type, data} = info
  switch (info.type) {
    case PerformerSignupOptions.IN_PERSON:
      out += 'In-person only\n'
      out += getInPersonSummary(data.in_person)
      break
    case PerformerSignupOptions.PRE_REGISTRATION:
      out += 'Pre-registration only\n'
      out += getPreRegistrationSummary(data.pre_registration)
      break
    case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
      out += 'In-person and pre-registration\n'
      out += getInPersonSummary(data.in_person) + '\n'
      out += getPreRegistrationSummary(data.pre_registration)
      break
    default:
     throw new Error()
  }

  return out
}

function getPerformerCheckinSummary(info) {
  let out = `Check-in:\n\
  Begins: ${getRelativeTimeInfo(info.begins)}\n\
  Ends: ${getRelativeTimeInfo(info.ends)}`

  if (info.enable_in_app !== undefined) {
    out += `\n  Enable in-app check-in: ${info.enable_in_app}`
  }

  return out
}

function getCoverChargeSummary(info) {
  switch (info.type) {
    case CostOptions.COVER:
    case CostOptions.COVER_AND_MINIMUM_PURCHASE:
    case CostOptions.COVER_OR_MINIMUM_PURCHASE:
      return `$${info.data.cover}`
    default:
      return ''
  }
}

function getMinimumPurchaseSummary(info) {
  switch (info.type) {
    case CostOptions.MINIMUM_PURCHASE:
    case CostOptions.COVER_AND_MINIMUM_PURCHASE:
    case CostOptions.COVER_OR_MINIMUM_PURCHASE:
      const val = info.data.minimum_purchase
      const plural = `${val.data > 1 ? 's' : ''}`
      switch (val.type) {
        case PurchaseTypeOptions.DOLLARS:
          return `$${val.data}`
        case PurchaseTypeOptions.DRINK:
          return `${val.data} drink${plural}`
        case PurchaseTypeOptions.ITEM:
          return `${val.data} item${plural}`
        case PurchaseTypeOptions.DRINK_OR_ITEM:
          return `${val.data} drink${plural} or item${plural}`
        default:
          return ''
      }
    default:
      return ''
  }
}

function getPurchaseConjunction(info) {
  switch (info.type) {
    case CostOptions.COVER_AND_MINIMUM_PURCHASE:
      return ' and '
    case CostOptions.COVER_OR_MINIMUM_PURCHASE:
      return ' or '
    default:
      return ''
  }
}

function getCostString(info) {
  if (info.type === CostOptions.FREE) {
    return `Free`
  } else {
    return `${getCoverChargeSummary(info)}${getPurchaseConjunction(info)}${getMinimumPurchaseSummary(info)}`
  }
}

function getAudienceCostString(info) {
  return getCostString(info)
}

function getPerformerCostSummary(info) {
  return `Performer cost: ${getCostString(info)}`
}

function getMinutesSummary(info) {
  switch (info.type) {
    case MinutesTypeOptions.MAX:
      return `${info.data.max} minute${info.data.max === 1 ? '' : 's'}`
    case MinutesTypeOptions.RANGE:
      return `${info.data.min}/${info.type.max} minutes`
    default: 
      return ''
  }
}

function getSongsSummary(info) {
  return `${info} song${info > 1 ? 's' : ''}`
}

function getRoundSummary(info) {
  let out = ''
  switch (info.type) {
    case StageTimeOptions.MINUTES:
      out += getMinutesSummary(info.data.minutes)
      break
    case StageTimeOptions.SONGS:
      out += getSongsSummary(info.data.songs)
      break
    default:
      out += getMinutesSummary(info.data.minutes) + ' or ' + getSongsSummary(info.data.songs)
  }

  return out
}

function getStageTimeSummary(info) {
  if (info.length === 1) {
    return 'Stage-time: ' + getRoundSummary(info[0])
  } else {
    return 'Stage-time: \n' + info.map((x, index) => '  Round ' + (index+1) + ': ' + getRoundSummary(info[index]) + ((index < info.length - 1) ? '\n' : '')).join('')
  }
}

function getByTypePerformerLimitSummary(info) {
  switch (info.type) {
    case PerformerLimitOptions.NO_LIMIT:
      return 'No limit'
    case PerformerLimitOptions.LIMIT:
      return `${info.data} performers`
    default:
      return ''
  }
}

function getPerformerLimitSummary(info) {
  let out = 'Performer limit: '
  switch (info.type) {
    case PerformerLimitOptions.NO_LIMIT:
      out += 'None'
      break
    case PerformerLimitOptions.LIMIT:
      out += `${info.data.limit}${info.data.enable_waitlist ? ' + waitlist' : ''}`
      break
    default:
      const {in_person, pre_registration, enable_waitlist} = info.data
      out += `\n  In-person: ${getByTypePerformerLimitSummary(info.data.in_person)}\n  Pre-registration: ${getByTypePerformerLimitSummary(info.data.pre_registration)}`
      if (enable_waitlist) {
        out += `\n  Enable waitlist: true`
      }
  }

  return out
}

function getListedHostsSummary(info) {
  return info.length ? `Host${info.length > 1 ? 's' : ''}: ` + info.map((x, index) => x).join(', ') : ''
}

function getListedPerformersSummary(info) {
  return info.length ? `Performer${info.length > 1 ? 's' : ''}: ` + info.map((x, index) => `${x.name}${x.title && x.title.length ? ' (' + x.title + ')': ''}`).join(', ') : ''
}

function getAudienceCostSummary(info) {
  if (info.type === CostOptions.FREE) {
    return `Audience cost: Free`
  } else {
    return `Audience cost: ${getCoverChargeSummary(info)}${getPurchaseConjunction(info)}${getMinimumPurchaseSummary(info)}`
  }
}

function getSingleSummary(info) {
  const {begins, ends} = info
  const b = begins ? `Begins: ${begins.format('LLLL')}`: ''
  const e = ends ? `\nEnds: ${ends.format('LLLL')}` : ''

  return b + e
}

function getPositionString(info) {
  switch (info) {
    case 1:
      return '1st'
    case 2:
      return '2nd'
    case 3:
      return '3rd'
    case 4:
      return '4th'
    case -1:
      return 'last'
  }
}

function getSetPosSummary(bysetpos) {
  if (bysetpos) {
    const length = bysetpos.length
    if (length > 1) {
      return bysetpos.slice(0, length - 1).map(getPositionString).join(', ') + 'and ' + getPositionString(bysetpos[length -1])
    } else if (length === 1) {
      const val = getPositionString(bysetpos[length -1])
      return val.substring(0, 1).toUpperCase() + val.substring(1) 
    }
  }

  return ''
}

const toCamelCase = val => val.substring(0, 1).toUpperCase() + val.substring(1) 

function getByWeekdaySummary(byweekday) {
  if (byweekday) {
    const length = byweekday.length
    if (length > 1) {
      return byweekday.slice(0, length - 1).map(toCamelCase).join('s, ') + 'and ' + toCamelCase(byweekday[length - 1])
    } else if (length === 1) {
      const val = byweekday[length - 1]
      return toCamelCase(val)
    }
  }

  return ''
}

function getFromTo(dtstart, until) {
  const f = dtstart ? `\n  From: ${dtstart.format('LLL')}`: ''
  const t = until ? `\n  To: ${until.format('LLL')}` : ''

  return f + t
}


function getFreqSummary(rrule) {
  const {freq, byweekday, bysetpos, dtstart, until} = rrule
  const from_to = (dtstart || until) ? getFromTo(dtstart, until) : ''
  switch (freq) {
    case 'weekly':
      return 'Weekly ' + getByWeekdaySummary(byweekday) + 's'
    case 'monthly':
      return getSetPosSummary(bysetpos) + getByWeekdaySummary(byweekday)
    default:
      return ''
  }
}


function getRRuleSummary(rrule) {
  const {freq, byweekday, bysetpos, dtstart, until} = rrule
  const from_to = (dtstart || until) ? getFromTo(dtstart, until) : ''
  const freq_summary = getFreqSummary(rrule)
  switch (freq) {
    case 'weekly':
      return freq_summary + from_to
    case 'monthly':
      return freq_summary + from_to
    default:
      return ''
  }
}

function getRecurringSummary(info) {
  const {rrule, rdate, exdate} = info
  let out = ''
  if (rrule) {
    out += 'Recurrence rule: ' + getRRuleSummary(rrule)
  }

  if (rdate.length) {
    if (rrule) {
      out += `\nAdditional date${rdate.length > 1 ? 's' : ''}:\n`
    } else {
      out += `Date${rdate.length > 1 ? 's' : ''}:\n`
    }

    out += `${rdate.length ? '  ' : ''}` + rdate.map(x => x.format('LLLL')).join('\n  ')
   
  } 

  if (exdate.length) {
    if (rrule) {
      out += `\nExcluding date${exdate.length > 1 ? 's' : ''}:\n`
    }

    out += `${exdate.length ? '  ' : ''}` + exdate.map(x => x.format('LLLL')).join('\n  ')
  } 

  return out
}

function getCuandoSummary(type, cuando) {
  switch (type) {
    case ListingTypes.SINGLE:
      return getSingleSummary(cuando)
    case ListingTypes.RECURRING:
      return getRecurringSummary(cuando)
    default: 
      return ''
  }
}

function getContactInfoSummary(info) {
  const {email, twitter, facebook, instagram, website} = info
  if (Object.keys(info).every(x => !x)) return ''

  let out = 'Contact info:'
  if (info.email) {
    out += `\n  E-mail: ${email}`
  }

  if (info.twitter) {
    out += `\n  Twitter: ${twitter}`
  }

  if (info.facebook) {
    out += `\n  Facebook: ${facebook}`
  }

  if (info.instagram) {
    out += `\n  Instagram: ${instagram}`
  }

  if (info.website) {
    out += `\n  Website: ${website}`
  }

  return out
}

function renderWebsite(website) {
  const site = `http://${website}`
  return div(`.result-website`, [
    a({attrs: {href: site}}, [`Website`])
  ])
}


function renderEmail(email) {
  return div(`.row`, [
    div('.heading.text-input', ['E-mail']),
    a(`.text-input`, {attrs: {href: `mailto:${email}`}}, [email]),
  ])
}

function renderURL(title, url) {
  return div(`.row`, [
    div('.heading.text-input', [title]),
    a(`.text-input`, {attrs: {href: url}}, [url]),
  ])
}

function renderTwitter(handle) {
  return div(`.row`, [
    div('.heading.text-input', ['Twitter']),
    a(`.text-input`, {attrs: {href: `https://twitter.com/${handle.substring(1)}`}}, [handle]),
  ])
}

function renderInstagram(handle) {
  return div(`.row`, [
    div('.heading.text-input', ['Instagram']),
    a(`.text-input`, {attrs: {href: 'https://instagram.com/' + handle.substring(1)}}, [handle]),
  ])
}


function renderContactInfo(contact_info) {
  const has_info = Object.keys(contact_info).some(x => !!contact_info[x])
  if (has_info) {
    const {email, twitter, facebook, instagram, website} = contact_info

    return div(`.column`, [
      email ? renderEmail(email) : null,
      website ? renderURL('Website', website) : null,
      twitter ? renderTwitter(twitter) : null,
      instagram ? renderInstagram(instagram) : null,
      facebook ? renderURL('Facebook', facebook) : null
    ])
  }

  return null
}

function renderListedHosts(info) {
  if (info.length) {
    const plural = info.length >1
    const title = plural ? 'Hosts:' : 'Host:'
    return div('.row', [
      div('.heading.text-item', [title]),
      div('.text-item', info.join(`, `))
    ])
  } else {
    return null
  }
}


export function renderName(info) {
  return info ? strong([info]) : null
}

export function renderNameWithParentLink(listing) {
  const {meta, parent_id} = listing
  const {name} = meta
  return name ? parent_id ? button('.appGoToParent.btn.btn-link.wrap-link', [strong([name])]) : strong([name]) :null
}


function isOpenMic(listing) {
  return listing.meta.event_types.some(x => x === EventTypes.OPEN_MIC)
}

function isShow(listing) {
  return listing.meta.event_types.some(x => x === EventTypes.SHOW)
}

function isOpenMicAndShow(listing) {
  return isOpenMic(listing) && isShow(listing)
}

function getPerformerCostString(cost) {
  if (cost.length === 0) {
    return undefined
  }
  
  if (cost.length === 1) {
    if (cost[0].type === CostOptions.FREE) {
      return 'Free'
    } else {
      return getCostString(cost[0]).replace('and', '+')
    }
  }

  if (cost.some(x => x.type === CostOptions.FREE)) {
    return `Free/Paid`
  }

  return `Paid`
}

export function renderCost(listing) {
  const {audience_cost, performer_cost} = listing.meta
  let out
  if (isOpenMicAndShow(listing)) {
    if (performer_cost.length === 1 && deepEqual(audience_cost, performer_cost[0])) {
      out = getAudienceCostString(audience_cost)
    } else {
      const audience = getAudienceCostString(audience_cost)
      const performer = getPerformerCostString(performer_cost)
      return div([
        div([
          span(['Audience:']),
          span([audience])
        ]),
        div([
          span(['Performer:']),
          span([performer])
        ])
      ])
    }
  } else if (isShow(listing)) {
    out = getAudienceCostString(audience_cost)
  } else if (isOpenMic(listing)) {
    out = getPerformerCostString(performer_cost)
  } else {
    return null
  }

  return span('.float-xs-right', [out])
}

const CuandoStatusTypes = {
  PAST: 'past',
  ENDED_RECENTLY: 'ended-recently',
  ENDING_SOON: 'ending-soon',
  IN_PROGRESS: 'in-progress',
  STARTING_SOON: 'starting-soon',
  FUTURE: 'future'
}

function cuandoStatusToClass(type) {
  switch (type) {
    case CuandoStatusTypes.PAST:
      return '.text-muted'
    case CuandoStatusTypes.ENDED_RECENTLY:
      return '.text-muted.font-italic'
    case CuandoStatusTypes.ENDING_SOON:
      return '.text-success.font-italic'
    case CuandoStatusTypes.IN_PROGRESS:
      return '.text-success'
    case CuandoStatusTypes.STARTING_SOON:
      return '.text-warning.font-italic'
    case CuandoStatusTypes.FUTURE:
      return '.text-primary'      
  }
}

function cuandoStatusToText(type) {
  switch (type) {
    case CuandoStatusTypes.PAST:
      return 'Past'
    case CuandoStatusTypes.ENDED_RECENTLY:
      return 'Ended'
    case CuandoStatusTypes.ENDING_SOON:
      return 'Ending soon'
    case CuandoStatusTypes.IN_PROGRESS:
      return 'In progress'
    case CuandoStatusTypes.STARTING_SOON:
      return 'Starting soon'
    case CuandoStatusTypes.FUTURE:
      return 'Future'  
  }
}


function getDateTimeString(d) {
  if (moment().isSame(d, "day")) {
    return "Today, " + d.format(`h:mm A`)
  } else if (moment().add(1, "day").isSame(d, "day")) {
    return "Tomorrow, " + d.format(`h:mm A`)
  } else if (moment().subtract(1, "day").isSame(d, "day")) {
    return "Yesterday, " + d.format(`h:mm A`)
  } else {
    return d.format(`llll`)
  }
}

function getCuandoStatus(cuando) {
  //onsole.log(cuando)
  const {begins} = cuando
  const half_hour_before_start = begins.clone().subtract(30, 'minute')
  const ends = cuando.ends ? cuando.ends : begins.clone().add(120, 'minutes')
  const half_hour_before_end = ends.clone().subtract(30, 'minute')
  const six_hours_after_end = ends.clone().add(6, 'hours')

  const now = moment()
  if (now.isBefore(begins)) {
    //console.log(moment().add(30, 'minutes').isAfter(begins))
    if (now.isAfter(half_hour_before_start)) {
      return CuandoStatusTypes.STARTING_SOON
    } else {
      return CuandoStatusTypes.FUTURE
    }
  } else {
    if (now.isAfter(ends)) {
      if (now.isAfter(six_hours_after_end)) {
        return CuandoStatusTypes.PAST
      } else {
        return CuandoStatusTypes.ENDED_RECENTLY
      }

    } else {
      if (now.isAfter(half_hour_before_end)) {
        return CuandoStatusTypes.ENDING_SOON
      } else {
        return CuandoStatusTypes.IN_PROGRESS
      }
    }
  }
}

function getCuandoStatusClass(cuando) {
  return cuandoStatusToClass(getCuandoStatus(cuando))
}

export function renderCuandoStatus(cuando) {
  const status = getCuandoStatus(cuando)
  if (status === CuandoStatusTypes.FUTURE) {
    return null
  }

  return strong(`${getCuandoStatusClass(cuando)}.float-xs-right`, [
    cuandoStatusToText(status)
  ])
}


function renderSingleBegins(cuando) {
  const {begins} = cuando
  const status_class = getCuandoStatusClass(cuando)
  return span(`.mr-xs`, {
      class: {
        "text-muted": !moment().isBefore(begins)
      }
    }, [getDateTimeString(begins)])
}


function renderSingleEnds(cuando) {
  const {ends} = cuando
  const status_class = getCuandoStatusClass(cuando)
  return ends ? span(`.mr-xs`, {
      class: {
        "text-muted": !moment().isBefore(ends)
      }
    }, [getDateTimeString(ends)]) : null
}

export function renderSingle(cuando) {
  const {begins, ends} = cuando
  return div([
    renderSingleBegins(cuando),
    renderSingleEnds(cuando),
  ])
}

export function renderRecurring(cuando) {
  const rruleset = recurrenceToRRuleSet(cuando)
  const upcoming_dates = rruleset.between(moment().toDate(), moment().add(90, 'day').toDate())
  const upcoming_date = upcoming_dates.length ? moment(upcoming_dates[0].toISOString()) : undefined
  const upcoming = upcoming_date ? 
    div([
      strong('.mr-xs', ['Next event:']),
      span([upcoming_date.format('llll')])
    ]) : null

  const {rrule, rdate, exdate} = cuando
  if (rdate.length || exdate.length) {
    return div([
      span('.mr-xs', ['Recurring']),
      upcoming
    ])
  } else if (rrule) {
    return div([
      div([
        span('.mr-xs', ['Recurs:']),
        span([getFreqSummary(rrule)])
      ]),
      upcoming
    ])
  } else {
    return null
  }
}

export function renderCuando(listing) {
  const {type, cuando} = listing
  if (type === 'single') {
    return renderSingle(cuando)
  } else {
    return renderRecurring(cuando)
  }
}

function getMinutesInfo(info) {
  switch (info.type) {
    case MinutesTypeOptions.MAX:
      return `${info.data.max} minutes`
    case MinutesTypeOptions.RANGE:
      return `${info.data.min}-${info.data.max} minutes`
    default:
      throw new Error()
  }
}

function getSongsInfo(info) {
  return `${info} songs`
}

function getSingleRoundText(stage_time) {
  switch (stage_time.type) {
    case StageTimeOptions.MINUTES:
      return getMinutesInfo(stage_time.data.minutes)
    case StageTimeOptions.SONGS:
      return getSongsInfo(stage_time.data.songs)
    case StageTimeOptions.MINUTES_OR_SONGS:
      return `${getMinutesInfo(stage_time.data.minutes)}/${getSongsInfo(stage_time.data.songs)}`
    default:
      throw new Error() 
  }
}

export function renderStageTime(stage_time) {
  let text 
  const length = stage_time.length
  if (length === 0) {
    return null
  } else if (length === 1) {
    text = getSingleRoundText(stage_time[0])
  } else {
    text = 'Multi-round'
  }

  return div('.float-xs-right', [text])  

}

function getRelativeTimeInfoShort(info) {
  let val_string
  switch(info.type) {
    case RelativeTimeOptions.MINUTES_BEFORE_EVENT_START:
      return `${info.data.minutes} minutes`
    case RelativeTimeOptions.MINUTES_AFTER_EVENT_START:
      return `${info.data.minutes} minutes after`
    case RelativeTimeOptions.MINUTES_BEFORE_EVENT_END:
      return `${info.data.minutes} minutes from end` 
    case RelativeTimeOptions.EVENT_START:
      return 'Event start'
    case RelativeTimeOptions.EVENT_END:
      return 'Event end'
    case RelativeTimeOptions.UPON_POSTING:
      return 'Upon posting'
    case RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME:
      const time = to12HourTime(info.data.time)
      return `${info.data.day} @ ${time.hour}:{time.minute} ${time.mode}`
  }
}


function getPreRegistrationTypeString(info) {
  return `${info.type === 'app' ? 'In-' : ''}${info.type}`
}

const capitalize = val => {
  if (val === 'email') return 'E-mail'
  else return val.substring(0, 1).toUpperCase() + val.substring(1)
}

export function renderPerformerSignup(info) {
  let out
  const {type, data} = info
  
  switch (info.type) {
    case PerformerSignupOptions.IN_PERSON:
      out = 'In person'
      break
    case PerformerSignupOptions.PRE_REGISTRATION:
      out = `${capitalize(data.pre_registration.type)}`
      break
    case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
      out = `In person/${capitalize(data.pre_registration.type)}`
      break
    default:
     throw new Error()
  }

  return span('.float-xs-right', [out])
}

function getPerformerLimitInfo(info) {
  switch (info.type) {
    case PerformerLimitOptions.NO_LIMIT:
      return `No limit`
    case PerformerLimitOptions.LIMIT:
      return `${info.data}`
    default:
      throw new Error()
  }
}

export function renderPerformerLimit(info) {
  let text
  switch (info.type) {
    case PerformerLimitOptions.NO_LIMIT:
      return null
    case PerformerLimitOptions.LIMIT:
      text = `${info.data.limit} people`
      break
    case PerformerLimitOptions.LIMIT_BY_SIGN_UP_TYPE:
      text = `${getPerformerLimitInfo(info.data.in_person)} + ${getPerformerLimitInfo(info.data.pre_registration)} performers`
      break
    default:
      throw new Error() 
  }

  return div('.float-xs-right', [text])
}

function renderDondeVenue(donde) {
  const name = getVenueName(donde)
  return address([
    em([getVenueName(donde)]),
    div([getVenueAddress(donde)])
  ])
}

function renderDondeBadslava(donde) {
  return address([
    em([getBadslavaName(donde)]),
    div([donde.street]),
    div([donde.city])
  ])
}

export function renderDonde(donde) {
  if (donde.type === "venue") return renderDondeVenue(donde)
  if (donde.type === "badslava") return renderDondeBadslava(donde)
  throw new Error()
}


export function renderTextList(info) {
  if (info.length) {
    return div('.float-xs-right', [small([info.join(`, `).replace('_', '-')])])
  } else {
    return null
  }
}

// export function renderSingleListing(listing) {
//   const {type, donde, cuando, meta} = listing
//   const {
//     name, event_types, categories, notes, 
//     performer_cost, description, contact_info, 
//     performer_sign_up, stage_time, 
//     performer_limit, listed_hosts} = meta

//   return div('.container-fluid.no-gutter', [
//     div('.row.no-gutter', [
//       div('.col-xs-6', [
//         div('.row.no-gutter', [
//           renderName(name)
//         ]),
//         div('.row.no-gutter', [
//           renderCuando(listing)
//         ]),
//         div('.row.no-gutter', [
//           renderDonde(donde)
//         ])
//       ]),
//       div('.col-xs-6', [
//         div('.row.no-gutter.clearfix', [
//           renderCuandoStatus(cuando)
//         ]),
//         performer_cost ? div('.row.no-gutter.clearfix', [
//           renderCost(listing)
//         ]) : null,
//         stage_time ? div('.row.no-gutter.clearfix', [
//           renderStageTime(stage_time)
//         ]) : null,
//         performer_sign_up ? div('.row.no-gutter.clearfix', [
//           renderPerformerSignup(performer_sign_up)
//         ]) : null,
//         performer_limit ? div('.row.no-gutter.clearfix', [
//           renderPerformerLimit(performer_limit)
//         ]) : null,
//         categories.length ? div('.row.no-gutter.clearfix', [
//           renderTextList(categories)
//         ]) : null,
//         // event_types.length ? div('.row.no-gutter.clearfix', [
//         //   renderTextList(event_types)
//         // ]) : null
//       ])
//     ])
//   ])
// }
