import {Observable as O} from 'rxjs'
import {div, pre, span, input, button} from '@cycle/dom'
import {combineObj} from '../../../../utils'
import {to12HourTime} from '../../../../helpers/time'
import {PerformerSignupOptions, RelativeTimeOptions, CostOptions, PurchaseTypeOptions, StageTimeOptions, MinutesTypeOptions, PerformerLimitOptions} from '../helpers'
import moment = require('moment')
import {RRule} from 'rrule'

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
    Ends: ${getRelativeTimeInfo(info.ends)}\n\
`
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
      return `Previous ${info.data.day} @ ${time.hour}:{time.minute} ${time.mode}`
  }
}

function getPreRegistrationSummary(info) {
  return `  Pre-registration: ${info.type === 'app' ? 'In-' : 'By '}${info.type}\
  ${getPreregistrationData(info)}\n\
    Begins: ${getRelativeTimeInfo(info.begins)}\n\
    Ends: ${getRelativeTimeInfo(info.ends)}\n\
`
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
      out += 'Allow both in-person and pre-registration\n'
      out += getInPersonSummary(data.in_person)
      out += getPreRegistrationSummary(data.pre_registration)
      break
    default:
     throw new Error()
  }

  return out
}

function getCheckinSummary(info) {
  return `Check-in:\n\
  Allowed radius: ${info.radius}\n\
  Begins: ${getRelativeTimeInfo(info.begins)}\n\
  Ends: ${getRelativeTimeInfo(info.ends)}\n`
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
      switch (val.type) {
        case PurchaseTypeOptions.DOLLARS:
          return `$${val.data}`
        case PurchaseTypeOptions.DRINK:
          return `${val.data} drink${val.data > 1 ? 's' : ''}`
        case PurchaseTypeOptions.ITEM:
          return `${val.data} item${val.data > 1 ? 's' : ''}`
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

function getPerformerCostSummary(info) {
  if (info.type === CostOptions.FREE) {
    return `Performer cost: Free`
  } else {
    return `Performer cost: ${getCoverChargeSummary(info)}${getPurchaseConjunction(info)}${getMinimumPurchaseSummary(info)}`
  }
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
    return 'Stage-time: \n' + info.map((x, index) => '  Round ' + (index+1) + ': ' + getRoundSummary(info[index]) + '\n').join('')
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
      out += `\n  In-person: ${getByTypePerformerLimitSummary(info.data.in_person)}\n  Pre-registration: ${getByTypePerformerLimitSummary(info.data.pre_registration)}\n`
      if (enable_waitlist) {
        out += `  Enable waitlist: True`
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


function getRRuleSummary(rrule) {
  const {freq, byweekday, bysetpos, dtstart, until} = rrule
  const from_to = (dtstart || until) ? getFromTo(dtstart, until) : ''
  switch (freq) {
    case 'weekly':
      return getByWeekdaySummary(byweekday) + 's, Weekly' + from_to
    case 'monthly':
      return getSetPosSummary(bysetpos) + getByWeekdaySummary(byweekday) + ' of the month' + from_to
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
    case 'single':
      return getSingleSummary(cuando)
    case 'recurring':
      return getRecurringSummary(cuando)
    default: 
      return ''
  }
}

function getContactInfoSummary(info) {
  const {email, twitter, facebook, instagram} = info
  if ([email, twitter, facebook, instagram].every(x => !x)) return ''

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

  return out
}


function renderSummary(state) {
  const {session} = state
  const {listing} = session
  const {type, meta, donde, cuando, event_types, categories} = listing
  const {
    title, description, performer_signup, check_in, performer_cost, 
    stage_time, performer_limit, listed_hosts, listed_performers, 
    audience_cost, contact_info} = meta

  return div(`.column.listing-summary`, [
    pre([
      `Title: ${title}\n\
Description: ${description}\n\
Type: ${type}\n\
Event types: ${event_types.join(', ')}\n\
Search categories: ${categories.join(', ')}\n\
${getDondeSummary(donde)}\n\
${getCuandoSummary(type, cuando)}\n\
${event_types.some(x => x === 'open-mic') ? getPerformerSignupSummary(performer_signup) : ''}\
${getCheckinSummary(check_in)}\
${event_types.some(x => x === 'open-mic') ? getPerformerCostSummary(performer_cost) : ''}\n\
${event_types.some(x => x === 'open-mic') ? getStageTimeSummary(stage_time) : ''}\n\
${event_types.some(x => x === 'open-mic') ? getPerformerLimitSummary(performer_limit) : ''}\n\
${getListedHostsSummary(listed_hosts)}\
${event_types.some(x => x === 'show') ? getListedPerformersSummary(listed_performers) : ''}\n\
${event_types.some(x => x === 'show') ? getAudienceCostSummary(audience_cost) : ''}\n\
${getContactInfoSummary(contact_info)}\
`
    ])
  ])
}


function renderListingCard(state) {
  const {session} = state
  const {listing} = session
  const {type, meta, event_types, categories} = listing
  const {title, description} = meta

  return div(`.listing-card`, [
    // div(`.top`, [
    //   div(`.left`, [
    //     renderName(name),
    //     renderDateTimeBegins(cuando),
    //     renderDateTimeEnds(cuando),
    //     renderDonde(donde),
    //     renderContactInfo(contact),
    //     renderHostInfo(hosts)
    //   ]),
    //   div(`.right`, [
    //     renderStatus(cuando),
    //     renderCost(cost),
    //     renderStageTime(stage_time),
    //     renderSignup(cuando, sign_up),
    //     renderPerformerLimit(performer_limit),
    //     checked_in ? div(`.result-check-in`, [`Checked-in`]) : null
    //   ])
    // ]),
    // div(`.bottom`, [
    //   renderNote(note),
    // ])
  ])

}



export default function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {session} = state
      const {listing} = session
      const {type, meta, event_types, categories} = listing
      const {title, description} = meta

      return div(`.workflow-step.preview`, [
        div(`.heading`, ['Preview listing']),
        div(`.body`, [
          div('.column', [
            button('.appPostButton.outline-button.medium', [
              div('.flex.align-center', [
                'Post'
              ])
            ])
          ]),
          renderSummary(state),
          renderListingCard(state)
        ])
      ])
    })
}