import {Observable as O} from 'rxjs'
import {div, a, pre, span, input, button, strong, h6, em, b, address, small, ul, li} from '@cycle/dom'
import {combineObj} from '../../../utils'
import {to12HourTime} from '../../../helpers/time'
import {ListingTypes, RecurrenceFrequency, EventTypes, PerformerSignupOptions, PreRegistrationOptions, RelativeTimeOptions, CostOptions, TierPerkOptions, PurchaseTypeOptions, StageTimeOptions, MinutesTypeOptions, PerformerLimitOptions} from '../../../listingTypes'
import moment = require('moment')
import {cuandoToRRuleSet} from './utils'
import {getBadslavaName, getVenueName, getVenueAddress, getVenueLngLat} from '../../../helpers/donde'

import deepEqual = require('deep-equal')


function getDondeSummary(donde) {
  const {type} = donde
  if (type === 'venue') {
    if (donde.source === 'foursquare') {
      const {data} = donde
      const {name, location} = data
      return `Where: ${name}\nAddress: ${location.address}, ${location.city}, ${location.state} ${location.postalCode}`
    }
  } else if (type === 'badslava') {
    const {name, street, city, stateAbbr} = donde
    return `Where: ${name}\nAddress: ${street}, ${city}, ${stateAbbr}`  
  }
}

export function getDondeNameString(donde) {
  const {type} = donde
  if (type === 'venue') {
    if (donde.source === 'foursquare') {
      const {data} = donde
      const {name} = data
      return name
    }
  } else if (type === 'badslava') {
    const {name} = donde
    return name  
  }
}

export function getDondeCityString(donde) {
  const {type} = donde
  if (type === 'venue') {
    if (donde.source === 'foursquare') {
      const {data} = donde
      const {location} = data
      return location.city
    } 
  } else if (type === 'badslava') {
    return donde.city 
  }
}
export function getDondeStateString(donde) {
  const {type} = donde
  if (type === 'venue') {
    if (donde.source === 'foursquare') {
      const {data} = donde
      const {location} = data
      return location.state
    } 
  } else if (type === 'badslava') {
    return donde.state_abbr
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
      return `${info.data.minutes} mins before event start`
    case RelativeTimeOptions.MINUTES_AFTER_EVENT_START:
      return `${info.data.minutes} mins after event start`
    case RelativeTimeOptions.MINUTES_BEFORE_EVENT_END:
      return `${info.data.minutes} mins before event end`
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

const pluralize = (amt, type) => amt > 1 ? `${type}s` : type

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
          return '' + val.data + ' ' + pluralize(val.data, 'drink')
        case PurchaseTypeOptions.ITEM:
          return '' + val.data + ' ' + pluralize(val.data, 'item')
        case PurchaseTypeOptions.DRINK_OR_ITEM:
          return '' + val.data + ' ' + pluralize(val.data, 'drink') + ' or ' + pluralize(val.data, 'item')
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

// function getMinutesSummary(info) {
//   switch (info.type) {
//     case MinutesTypeOptions.MAX:
//       return `${info.data.max} minute${info.data.max === 1 ? '' : 's'}`
//     case MinutesTypeOptions.RANGE:
//       return `${info.data.min}/${info.type.max} minutes`
//     default: 
//       return ''
//   }
// }

// function getSongsSummary(info) {
//   return `${info} song${info > 1 ? 's' : ''}`
// }

// function getRoundSummary(info) {
//   let out = ''
//   switch (info.type) {
//     case StageTimeOptions.MINUTES:
//       out += getMinutesSummary(info.data.minutes)
//       break
//     case StageTimeOptions.SONGS:
//       out += getSongsSummary(info.data.songs)
//       break
//     default:
//       out += getMinutesSummary(info.data.minutes) + ' or ' + getSongsSummary(info.data.songs)
//   }

//   return out
// }

function getStageTimeSummary(info) {
  if (info.length === 1) {
    return 'Stage-time: ' + getSingleRoundText(info[0])
  } else {
    return 'Stage-time: \n' + info.map((x, index) => '  Round ' + (index+1) + ': ' + getSingleRoundText(info[index]) + ((index < info.length - 1) ? '\n' : '')).join('')
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

function getWeekdaySummary(byweekday, dtstart) {
  if (byweekday) {
    const length = byweekday.length
    if (length > 1) {
      return byweekday.slice(0, length - 1).map(toCamelCase).join('s, ') + 'and ' + toCamelCase(byweekday[length - 1])
    } else if (length === 1) {
      const val = byweekday[length - 1]
      return toCamelCase(val)
    }
  } else {
    return dtstart.format('dddd')
  }

  return ''
}

function getFromTo(dtstart, until) {
  const f = dtstart ? `\n  From: ${dtstart.format('LLL')}`: ''
  const t = until ? `\n  To: ${until.format('LLL')}` : ''

  return f + t
}


export function getFreqSummary(rrules) {
  if (rrules && Array.isArray(rrules)) {
    if (rrules.length) {
      if (rrules.length === 1) {
        const rrule = rrules[0]
        const {freq, byweekday, bysetpos, dtstart, until} = rrule
        const from_to = (dtstart || until) ? getFromTo(dtstart, until) : ''
        switch (freq) {
          case 'weekly':
            return 'Weekly ' + getWeekdaySummary(byweekday, dtstart) + 's'
          case 'monthly':
            return getSetPosSummary(bysetpos) + getWeekdaySummary(byweekday, dtstart)
          default:
            return ''
        }
      } else {
        if (rrules.every(rrule => rrule.freq === RecurrenceFrequency.WEEKLY)) {
          return 'Weekly ' + rrules.reduce((arr, rrule) => arr.concat(rrule.byweekday)).join(', ')
        } else if (rrules.every(rrule => rrule.freq === RecurrenceFrequency.MONTHLY)) {
          const setpos = getSetPosSummary(rrules.reduce((arr, rrule) => arr.concat(rrule.bysetpos)))
          const day = rrules[0].byweekday[0]
          return 'Monthly ' + setpos + ' ' + day
        } else {
          return 'Multiple rule types'
        }
      }
    } else {
      return ''
    }
  }

  throw new Error('Invalid value given for rrules')

}


// function getRRuleSummary(rrules) {
//   //const rrule = rrules[0]
//   const {freq, byweekday, bysetpos, dtstart, until} = rrule
//   const from_to = (dtstart || until) ? getFromTo(dtstart, until) : ''
//   const freq_summary = getFreqSummary(rrules)
//   switch (freq) {
//     case 'weekly':
//       return freq_summary + from_to
//     case 'monthly':
//       return freq_summary + from_to
//     default:
//       return ''
//   }
// }

function getRecurringSummary(info) {
  const {rrules, rdates, exdates} = info
  let out = ''
  if (rrules.length) {
    out += 'Recurrence rule: ' + getFreqSummary(rrules)
  }

  if (rdates.length) {
    if (rrules.length) {
      out += `\nAdditional date${rdates.length > 1 ? 's' : ''}:\n`
    } else {
      out += `Date${rdates.length > 1 ? 's' : ''}:\n`
    }

    out += `${rdates.length ? '  ' : ''}` + rdates.map(x => x.format('LLLL')).join('\n  ')
   
  } 

  if (exdates.length) {
    if (rrules.length) {
      out += `\nExcluding date${exdates.length > 1 ? 's' : ''}:\n`
    }

    out += `${exdates.length ? '  ' : ''}` + exdates.map(x => x.format('LLLL')).join('\n  ')
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
  return name ? parent_id ? div('.d-flex.flex-column', [
    button('.appGoToParent.btn.btn-link.wrap-link.mb-2', [
      span('.fa.fa-angle-double-up..mr-1', []),
      strong(['Go to parent listing'])
    ]),
    strong([name])
   ]) : strong([name]) :null
}

export function renderParentLink(listing) {
  const {meta, parent_id} = listing
  const {name} = meta
  return parent_id ? div('.d-flex.flex-column', [
    button('.appGoToParent.btn.btn-link.wrap-link.mb-2', [
      span('.fa.fa-angle-double-left..mr-1', []),
      strong(['Go to parent listing'])
    ]),
   ]) : null
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

function getSummaryPerformerCostString(cost) {
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
      const performer = getSummaryPerformerCostString(performer_cost)
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
    out = getSummaryPerformerCostString(performer_cost)
  } else {
    return null
  }

  return span('.d-flex.justify-content-end', [out])
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


export function getDateTimeString(d) {
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

export function getCuandoStatus(cuando) {
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

  return strong(`${getCuandoStatusClass(cuando)}.d-flex.justify-content-end`, [
    cuandoStatusToText(status)
  ])
}

export function renderStatus(listing) {
  const {release, cuando} = listing
  if (release === 'posted') {
    renderCuandoStatus(cuando)
  } else if (release === 'canceled') {
    return strong('.red.d-flex.justify-content-end', [capitalize(release)])
  } else if (release === 'staged') {
    return strong('.blue.d-flex.justify-content-end', [capitalize(release)])
  }

  return null

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

export function renderRecurring(cuando, release) {
  const rruleset = cuandoToRRuleSet(cuando)
  const upcoming_dates = rruleset.between(moment().toDate(), moment().add(90, 'day').toDate())
  const upcoming_date = upcoming_dates.length ? moment(upcoming_dates[0].toISOString()) : undefined
  let upcoming = null
  if (release !== 'canceled') {
    if (upcoming_date) {
      upcoming = div([
        em('.mr-xs', ['Next event:']),
        span([upcoming_date.format('ddd, M/D/YY h:mm a')])
      ])
    }
  } 
  // else {
  //   const recent_dates = rruleset.between(moment().subtract(30, 'day').toDate(), moment().toDate())
  //   const recent_date = recent_dates.length ? moment(recent_dates[recent_dates.length - 1].toISOString()) : undefined
  //   upcoming = div([
  //     em('.mr-xs', ['Last event:']),
  //     span([recent_date.format('ddd, M/D/YY h:mm a')])
  //   ])
  // }

  const {rrules, rdates, exdates} = cuando 
  if ((rdates && rdates.length) || (exdates && exdates.length)) {
    return div([
      span('.mr-xs', ['Recurring']),
      upcoming
    ])
  } else if (rrules && rrules.length) {
    //if(rrules.length === 1) {
      return div([
        div([
          span('.mr-xs', [release === 'canceled' ? 'Recurred:' : 'Recurs:']),
          span([getFreqSummary(rrules)])
        ]),
        upcoming
      ])
    // } else {

    // }
  } else {
    return null
  }
}

export function renderCuando(listing) {
  const {type, cuando, release} = listing
  if (type === 'single') {
    return renderSingle(cuando)
  } else {
    return renderRecurring(cuando, release)
  }
}

function getMinutesInfo(info) {
  switch (info.type) {
    case MinutesTypeOptions.MAX:
      return stitchString(info.data.max, 'min')
    case MinutesTypeOptions.RANGE:
      return `${info.data.min}-${stitchString(info.data.max, 'min')}`
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

  return div('.d-flex.justify-content-end', [text])  

}

function getRelativeTimeInfoShort(info) {
  let val_string
  switch(info.type) {
    case RelativeTimeOptions.MINUTES_BEFORE_EVENT_START:
      return stitchString(info.data.minutes, 'min')
    case RelativeTimeOptions.MINUTES_AFTER_EVENT_START:
      return `${stitchString(info.data.minutes, 'min')} after`
    case RelativeTimeOptions.MINUTES_BEFORE_EVENT_END:
      return `${stitchString(info.data.minutes, 'min')} from end` 
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

function normalizeWebAddress(site) {
  if (site.indexOf('http') === 0) return site
  else return 'http:\/\/' + site
}

function renderPreRegistrationType(pre_registration) {
  switch (pre_registration.type) {
    case PreRegistrationOptions.WEBSITE:
      return a({attrs: {href: normalizeWebAddress(pre_registration.data)}}, ['Website'])
    case PreRegistrationOptions.EMAIL:
      return a({attrs: {href: `mailto:${pre_registration.data}`}}, ['Email'])
    case PreRegistrationOptions.APP:
      return 'App'
    default:
      throw new Error()
  }
}

export function renderPerformerSignup(info) {
  let out
  const {type, data} = info
  
  switch (type) {
    case PerformerSignupOptions.IN_PERSON:
      out = 'In person'
      break
    case PerformerSignupOptions.PRE_REGISTRATION:
      out = renderPreRegistrationType(data.pre_registration)
      break
    case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
      out = span([span(['In person/']), span([renderPreRegistrationType(data.pre_registration)])])
      break
    default:
     throw new Error()
  }

  return span('.d-flex.justify-content-end', [out])
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
      text = `${info.data.limit} performers`
      break
    case PerformerLimitOptions.LIMIT_BY_SIGN_UP_TYPE:
      text = `${getPerformerLimitInfo(info.data.in_person)} + ${getPerformerLimitInfo(info.data.pre_registration)} performers`
      break
    default:
      throw new Error() 
  }

  return div('.d-flex.justify-content-end', [text])
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
    return div('.d-flex.justify-content-end', [small([info.join(`, `).replace('_', '-')])])
  } else {
    return null
  }
}

export function renderNote(note) {
  if (note) {
    const new_note = note.replace(/\\n/g, '\n')
    return pre('.row.no-gutter', [
      new_note
    ])
  } else {
    return null
  }
}

function isMinutesPerk(type) {
  switch (type) {
    case TierPerkOptions.MINUTES:
    case TierPerkOptions.ADDITIONAL_MINUTES:
    case TierPerkOptions.ADDITIONAL_MINUTES_AND_PRIORITY_ORDER:
      return true
    default: 
      return false
  }
}

function isSongsPerk(type) {
  switch (type) {
    case TierPerkOptions.SONGS:
    case TierPerkOptions.ADDITIONAL_SONGS:
    case TierPerkOptions.ADDITIONAL_SONGS_AND_PRIORITY_ORDER:
      return true
    default: 
      return false
  }
}

function isNonTimePerk(type) {
  switch (type) {
    case TierPerkOptions.DRINK_TICKET:
    case TierPerkOptions.ADDITIONAL_BUCKET_ENTRY:
    case TierPerkOptions.PRIORITY_ORDER:
      return true
    default: 
      return false
  }
}

function hasPerk(cost) {
  return !!cost.perk
}


export function consistentWithSongsStageTime(performer_cost) {
  return performer_cost.every(c => {
    return !hasPerk(c) || (isNonTimePerk(c.perk.type) || isSongsPerk(c.perk.type))
  })
}

export function consistentWithMinutesStageTime(performer_cost) {
  return performer_cost.every(c => {
    return !hasPerk(c) || (isNonTimePerk(c.perk.type) || isMinutesPerk(c.perk.type))
  })
}

export function consistentWithMinutesOrSongsStageTime(performer_cost) {
  return performer_cost.every(c => {
    return !hasPerk(c) || isNonTimePerk(c.perk.type)
  })
}

export function hasStageTimeMinutesInfo(stage_time) {
  return stage_time.every(x => x.type === StageTimeOptions.MINUTES)
}

export function hasStageTimeSongsInfo(stage_time) {
  return stage_time.every(x => x.type === StageTimeOptions.SONGS)
}


export function hasConsistentStageTimeType(performer_cost, stage_time) {
  if (performer_cost.length <= 1) return true
  if (stage_time.length === 0) return true

  const has_stage_time_minutes = hasStageTimeMinutesInfo(stage_time)
  const has_stage_time_songs = hasStageTimeSongsInfo(stage_time)

  if (stage_time.length === 1) {
    if (stage_time[0].type === StageTimeOptions.SEE_NOTE) return true
    if (stage_time[0].type === StageTimeOptions.MINUTES_OR_SONGS) {
      return consistentWithMinutesOrSongsStageTime(performer_cost)
    }
  }

  if (has_stage_time_minutes) return consistentWithMinutesStageTime(performer_cost)
  if (has_stage_time_songs) return consistentWithSongsStageTime(performer_cost)

  console.error('Cost tiers are incompatible with stage time rounds')
  return false
}


function stitchString(amt, type, perk?) {
  return '' + amt + ' ' + pluralize(amt, type) + (perk ? ' + ' + perk.replace('_', ' ') : '')
}

function getPerformerTierPerkString(cost) {
    let out
    if (cost.perk) {
      switch (cost.perk.type) {
        case TierPerkOptions.MINUTES:
          out = '/' + stitchString(cost.perk.data, 'min')
          break
        case TierPerkOptions.MINUTES_AND_PRIORITY_ORDER:
          out = '/' + stitchString(cost.perk.data, 'min')
          break
        case TierPerkOptions.ADDITIONAL_MINUTES:
          out = '/' + stitchString(cost.perk.data, 'additional min')
          break
        case TierPerkOptions.ADDITIONAL_MINUTES_AND_PRIORITY_ORDER:
          out = '/' + stitchString(cost.perk.data, 'additional min')
          break
        case TierPerkOptions.SONGS:
          out = '/' + stitchString(cost.perk.data, 'song')
          break
        case TierPerkOptions.SONGS_AND_PRIORITY_ORDER:
          out = '/' + stitchString(cost.perk.data, 'song')
          break
        case TierPerkOptions.ADDITIONAL_SONGS:
          out = '/' + stitchString(cost.perk.data, 'additional song')
          break
        case TierPerkOptions.ADDITIONAL_SONGS_AND_PRIORITY_ORDER:
          out = '/' + stitchString(cost.perk.data, 'additional song')
          break
        default:
          out = '/' + cost.perk.type
      }
    } else {
      out = ''
    }

    return out
}

function getPerformerCostTierString(cost) {
  return getPerformerCostString(cost) + getPerformerTierPerkString(cost)
}

export function renderFullStageTime(stage_time) {
  let text 
  const length = stage_time.length
  if (length === 0) {
    return null
  } else if (length === 1) {
    return span('.d-flex.justify-content-end', [ getSingleRoundText(stage_time[0]) ])
  } else {
    const base = stage_time[0]
    if (stage_time.every(x => deepEqual(base, x))) {
      return span('.d-flex.justify-content-end', [ '' + length + ' rounds: ' + getSingleRoundText(stage_time[0]) + ' per' ])
    } else {
      return div(stage_time.map((s, index) => {
        return div('.row', [
          div('.col-12', [
            span('.d-flex.justify-content-end', [
              'Round ' + (index + 1) + ': ' + getSingleRoundText(s)
            ])
          ])
        ])
      }))
    }
  }
}

export function renderFullPerformerCost(performer_cost) {
  let text 
  const length = performer_cost.length
  if (length === 0) {
    return null
  } else if (length === 1) {
    return span('.d-flex.justify-content-end', [ getPerformerCostString(performer_cost[0]) ])
  } else {
    return div(performer_cost.map((c, index) => {
      return div('.row', [
        div('.col-12', [
          span('.d-flex.justify-content-end', [
            'Tier ' + (index + 1) + ': ' + getPerformerCostTierString(c)
          ])
        ])
      ])
    }))
  }
}

function incrementMinutes(minutes_data, inc) {
  switch (minutes_data.type) {
    case MinutesTypeOptions.MAX:
      return {
        type: minutes_data.type,
        data: {
          max: minutes_data.data.max + inc
        }
      }
    case MinutesTypeOptions.RANGE:
      return {
        type: minutes_data.type,
        data: {
          max: minutes_data.data.max + inc,
          min: minutes_data.data.min + inc
        }
      }
    default: 
      throw new Error(`Invalid minutes type: ${minutes_data.type}`)
  }
}

function productize(c, stage_time) {
    let out
    if (c.perk) {
      switch (c.perk.type) {
        case TierPerkOptions.MINUTES:
          out = {
            stage_time: {
              type: StageTimeOptions.MINUTES,
              data: {
                minutes: {
                  type: MinutesTypeOptions.MAX,
                  data: {
                    max: c.perk.data
                  }
                }
              }
            }, 
            perk: undefined
          }
        case TierPerkOptions.ADDITIONAL_MINUTES:
          out = {
            stage_time: {
              type: StageTimeOptions.MINUTES,
              data: {
                minutes: incrementMinutes(stage_time.data.minutes, c.perk.data)
              }
            }, 
            perk: undefined
          }
        case TierPerkOptions.ADDITIONAL_MINUTES_AND_PRIORITY_ORDER:
          out = {
            stage_time: {
              type: StageTimeOptions.MINUTES,
              data: {
                minutes: incrementMinutes(stage_time.data.minutes, c.perk.data)
              }
            }, 
            perk: TierPerkOptions.PRIORITY_ORDER
          }
        case TierPerkOptions.SONGS:
          out = {
            stage_time: {
              type: StageTimeOptions.SONGS,
              data: {
                songs: c.perk.data
              }
            }, 
            perk: undefined
          }
        case TierPerkOptions.ADDITIONAL_SONGS:
          out = {
            stage_time: {
              type: StageTimeOptions.SONGS,
              data: {
                songs: c.perk.data + stage_time.data.songs
              }
            }, 
            perk: undefined
          }
        case TierPerkOptions.ADDITIONAL_SONGS_AND_PRIORITY_ORDER:
          out = {
            stage_time: {
              type: StageTimeOptions.SONGS,
              data: {
                songs: c.perk.data + stage_time.data.songs
              }
            }, 
            perk: TierPerkOptions.PRIORITY_ORDER
          }
        default:
          out = {
            stage_time, 
            perk: c.perk.type
          }
      }
    } else {
      out =  {
        stage_time,
        perk: undefined
      }
    }


  return {
    type: c.type,
    data: c.data,
    product: out
  }
}

function getProductPerkString(perk) {
  if (perk) {
    return perk.replace('_', ' ')
  } else {
    return ''
  }
}

function getPerkString(perk) {
  if (perk) {
    return perk.replace('_', ' ')
  } else {
    return ''
  }
}

function getPerformerCostString(cost) {
  if (cost.type === CostOptions.FREE) {
    return 'Free'
  } else {
    return getCostString(cost).replace('and', '+')
  }
}

function renderMergedPerformerCostAndStageTime(performer_cost, stage_time) {
  const products = performer_cost.map(tier => productize(tier, stage_time))
  return div('.row', [
    div(['Cost tiers']),
    ul('.unstyled-list', products.map(p => {
      return li([
        getPerformerCostString(p) + ' -> ' + getSingleRoundText(p.product.stage_time) + getProductPerkString(p.product.perk) 
      ])
    }))
  ])
}

export function getFullCostAndStageTime(performer_cost, stage_time) {
  if (performer_cost.length > 1 && stage_time.length === 1) {
    return [undefined, undefined, renderMergedPerformerCostAndStageTime(performer_cost, stage_time[0])]
  } else {
    return [renderFullPerformerCost(performer_cost), renderFullStageTime(stage_time), undefined]
  }
}

function getRowDiv(info) {
  return div('.row', [div('.col-12', [info])])
}

export function renderContactInfo(info) {
  const {email, twitter, facebook, instagram, website} = info
  if (Object.keys(info).every(x => !x)) return null
  let out = []

  if (email) {
    out.push(getRowDiv(a({attrs: {href: 'mailto:' + email}}, [email])))
  }

  // if (twitter) {
  //   out.push(getRightRowDiv('@' + twitter))
  // }

  // if (facebook) {
  //   out.push(getRightRowDiv(facebook))
  // }

  // if (instagram) {
  //   out.push(getRightRowDiv(instagram))
  // }

  if (website) {
    out.push(getRowDiv(a({attrs: {href: normalizeWebAddress(website)}}, [website])))
  }

  return div('.row.no-gutter.mb-4', out)
}
