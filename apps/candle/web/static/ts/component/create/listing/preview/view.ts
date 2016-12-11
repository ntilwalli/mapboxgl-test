import {Observable as O} from 'rxjs'
import {div, pre, span, input, button} from '@cycle/dom'
import {combineObj} from '../../../../utils'
import {to12HourTime} from '../../../../helpers/time'
import {PerformerSignupOptions, RelativeTimeOptions, CostOptions, PurchaseTypeOptions, StageTimeOptions, MinutesTypeOptions, PerformerLimitOptions} from '../helpers'

function renderListingCard(state) {
  const {session} = state
  const {listing} = session
  const {type, meta, event_types, categories} = listing
  const {title, description} = meta

  return div(`.listing-card`, [

  ])
}




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

function getPerformerLimitSummary(info) {
  let out = 'Performer limit: '
  // switch (info.type) {
  //   case PerformerLimitOptions.NO_LIMIT:
  //     out += 'None'
  //     break
  //   case PerformerLimitOptions.LIMIT:
  //     out += info.data
  //     break
  //   default:
  //     out += getMinutesSummary(info.data.minutes) + ' or ' + getSongsSummary(info.data.songs)
  // }

  return out
}


function renderSummary(state) {
  const {session} = state
  const {listing} = session
  const {type, meta, donde, cuando, event_types, categories} = listing
  const {title, description, performer_signup, check_in, performer_cost, stage_time} = meta

  return div(`.column.listing-summary`, [
    pre([
      `Title: ${title}\n\
Description: ${description}\n\
Type: ${type}\n\
Event Types: ${event_types.join(', ')}\n\
Search Categories: ${categories.join(', ')}\n\
${getDondeSummary(donde)}\n\
${event_types.some(x => x === 'open-mic') ? getPerformerSignupSummary(performer_signup) : ''}\
${getCheckinSummary(check_in)}\
${event_types.some(x => x === 'open-mic') ? getPerformerCostSummary(performer_cost) : ''}
${event_types.some(x => x === 'open-mic') ? getStageTimeSummary(stage_time) : ''}
`
    ])
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
          renderListingCard(state),
          pre('.column', [JSON.stringify(listing, null, 2)]),
        ])
      ])
    })
}