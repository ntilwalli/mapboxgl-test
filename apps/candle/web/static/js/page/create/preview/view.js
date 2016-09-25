import {Observable as O} from 'rxjs'
import {textarea, h3, h4, h5, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {combineObj, toMoment} from '../../../utils'
import {renderHeading} from '../helpers'
import {isDisabled} from '../listing'
import {RRule} from 'rrule'
import moment from 'moment'

function renderTitle(info) {
  const {state, components} = info
  const {listing} = state
  const {profile} = listing
  const {titleInput} = components
  const section = `description`
  const property = `title`
  const disabled = isDisabled(section, property, listing)
  if (!disabled) {
    return div(`.title`, [
      renderHeading(`Title`, section, property, listing),
      titleInput
    ])
  } else {
    return null
  }
}

function renderDescription(state) {
  const {listing} = state
  const {profile} = listing
  const {description} = profile.description
  const section = `description`
  const property = `description`
  const disabled = isDisabled(section, property, listing)
  if (!disabled) {
    return div(`.description`, [
      renderHeading(`Description`, section, property, listing),
      textarea(`.appDescriptionInput`, {props: {rows: 5}}, [description || ``])
    ])
  } else {
    return null
  }
}

function renderShortDescription(state) {
  const {listing} = state
  const {profile} = listing
  const {shortDescription} = profile.description
  const section = `description`
  const property = `shortDescription`
  const disabled = isDisabled(section, property, listing)
  if (!disabled) {
    return div(`.short-description`, [
      renderHeading(`Short description`, section, property, listing),
      textarea(`.appShortDescriptionInput`, {props: {rows: 2}}, [shortDescription || ``])
    ])
  } else {
    return null
  }
}

function renderCategories(state) {
  const {listing} = state
  const {profile} = listing
  const {categories} = profile.description
  const section = `description`
  const property = `categories`
  const disabled = isDisabled(section, property, listing)
  if (!disabled) {
    return div(`.categories`, [
      renderHeading(`Categories`, section, property, listing),
      input(
        `.appCategoriesInput.form-control`, 
        {props: {type: `text`, value: categories.join(`, `)}}) 
      ])
  } else {
    return null
  }
}

function getTimeString(ct) {
  const {hour, minute, mode} = ct
  const meridiem = mode === `A.M.` ? `AM` : `PM`
  return minute === 0 ?
    `${hour} ${meridiem}`
    : `${hour}:${minute < 10 ? '0' : ''}${minute} ${mode}`
}

function isWeekly(f) {
  return f === RRule.WEEKLY
}

function getFrequencyString(f) {
  return isWeekly(f) ? `Weekly` : `Monthly`
}

function getFirstRecurrence(rrule) {
  const rule = new RRule(rrule)
  const limitDay = toMoment(rrule.dtstart).add(1, `week`)
  return toMoment(rule.before(limitDay.toDate()))
}

function getLastRecurrence(rrule) {
  const rule = new RRule(rrule)
  const limitDay = toMoment(rrule.until).subtract(1, `week`)
  return toMoment(rule.after(limitDay.toDate(), true))
}

function getWeeklyRecurrenceDay(rrule) {
  const eventDate = getFirstRecurrence(rrule)
  return eventDate.format(`dddd`) + `s`
}

function getRecurrenceStartDate(rrule) {
  const eventDate = getFirstRecurrence(rrule)
  const today = moment()
  //return eventDate.format(getDateFormatString())
  return getDateDiffString(eventDate, today)
}

function isFirstRecurrenceInFuture(rrule) {
  const eventDate = getFirstRecurrence(rrule)
  const today = moment()
  const val = eventDate.diff(today) > 0
  return val
}

function hasUntilDate(rrule) {
  return !!rrule.until
}

function getDateDiffString(base, compare, type = `begin`) {
  const verbs = type === `begin` ? [`Begins`, `Began`] : [`Ends`, `Ended`] 
  const description = base.calendar()
  const terms = description.split(' ')//.slice(0, 0)
  if (base.diff(compare) > 0) {
    const out = terms
      //.filter(x => x === `Tomorrow` || x === `Today`)

    const text = out.length ? out[0] : description
    return `${verbs[0]} ${text}`
  } else {
    const out = terms
      //.filter(x => x === `Yesterday` || x === `Today`)

    const text = out.length ? out[0] : description
    return `${verbs[1]} ${text}`
  }
}

function getRecurrenceUntilDateString(rrule) {
  if (rrule.until) {
    const eventDate = toMoment(getLastRecurrence(rrule))
    const today = moment()
    return getDateDiffString(eventDate, today, `Ends`)
  }

  throw new Error(`Invalid until date`)
}

function renderRecurrence(info) {
  const {state} = info
  const {listing} = state
  const {profile} = listing
  const {time} = profile
  const {rrule, startTime, endTime, until, frequency} = time
  const blah = getRecurrenceUntilDateString(rrule)
  return div(`.recurrence-time.small-font`, [
    span(`.recurrence-frequency`, [
      getFrequencyString(frequency)
    ]),
    isWeekly(frequency) ? span(`.recurrence-day`, [
      getWeeklyRecurrenceDay(rrule)
    ]) : null,
    span(`.start-time`, [getTimeString(startTime)]),
    endTime ? span(`.end-time-container`, [
      span([`to`]),
      span(`.end-time`, [getTimeString(endTime)])
    ]) : null,
    isFirstRecurrenceInFuture(rrule) ? 
      div(`.recurrence-start-date`, [getRecurrenceStartDate(rrule)]) 
      : null,
    hasUntilDate(rrule) ? 
      div(`.recurrence-until-date`, [getRecurrenceUntilDateString(rrule)]) 
      : null

  ])
}

function getDayDateFormatString(d) {
  return "dddd, MMMM Do YYYY"
}

function getDateFormatString(d) {
  return "MMMM Do YYYY"
}

function getTimeFormatString(d) {
  return "h:mm a"
}

function renderEventTime(info) {
  const {state} = info
  const {listing} = state
  const {profile} = listing
  const {time} = profile
  const {start, end} = time

  if (start.type !== `datetime`) {
    throw new Error(`Unsupported type for start time`)
  }

  if (end && end.type !== `datetime`) {
    throw new Error(`Unsupported type for end time`)
  }

  const startMoment = toMoment(start.data)
  const endMoment = end ? toMoment(end.data) : undefined

  return div(`event-time`, [
    div(`.start-date`, [startMoment.format(getDateFormatString())]),
    div(`.start-time-container`, [
      span(`.start-title`, [`Starts:`]),
      span(`.start-time`, [startMoment.format(getTimeFormatString())])
    ]),
    end ? div(`.end-time-container`, [
      div(`.end-title`, [`Ends:`]),
      div(`.end-time`, [endMoment.format(getTimeFormatString())])
    ]): null
  ])
}

function renderGroup(info) {
  const {state} = info
  const {listing} = state
  const {type, profile} = listing
  const {meta, description, location, time} = profile
  const {title} = description
  const {frequency} = time
  const {mode} = location

  return div(`.listing-card`, [
    div([
      div([
        div([
          div([
            div(`.card-heading`, [
              div(`.event-title`, [title])
            ])
          ])
        ])
      ])
    ])
  ])
}

function getStreetString(address) {
  const val = address.split(",")
  return val.length ? val[0] : val
}

function renderVenue({state}) {
  const {listing} = state
  const {type, profile} = listing
  const {location} = profile
  const {mode, info} = location
  const {data} = info
  const {name, address} = data
  return div(`.venue`, [
    div(`.name`, [name]),
    div(`.streetAddress`, [getStreetString(address)])
  ])
}

function renderAddress({state}) {
  const {listing} = state
  const {type, profile} = listing
  const {location} = profile
  const {mode, info} = location
  const {street} = info
  return div(`.venue`, [
    div(`.name`, [name]),
    div(`.streetAddress`, [street])
  ])
}

function renderPoint({state}) {
  return null
}


function renderLocation(info) {
  const {state} = info
  const mode = state.listing.profile.location.mode
  return div(`.location`, [
    mode === `venue` ?
      renderVenue(info)
      : mode === `address` ?
        renderAddress(info)
        : renderPoint(info)
  ])
}

function renderCategories(info) {
  const {state} = info
  const {listing} = state
  const {profile} = listing
  const {description} = profile
  const {categories} = description
  
  if (categories && categories.length) {
    return div(`.categories`, categories.map(x => div(`.category`, [x]))) 
  }
  
  return null
}

function renderDescription(info) {
  const {state} = info
  const {listing} = state
  const {profile} = listing
  const {description} = profile.description
  
  if (description) {
    return div(`.description`, [
      div(`.title`, [`Description`]),
      div(`.content`, [description])
    ])
  }

  return null
}

function renderCreator(info) {
  const {authorization} = info.state
  return div(`.created-by`, [`@${authorization.username}`])
}

function renderAdditionalInfo(info) {
  return div(`.additional-info`, [
    renderDescription(info),
    renderCreator(info)
  ])
}

function renderRecurring(info) {
  const {state} = info
  const {listing} = state
  const {type, profile} = listing
  const {meta, location, time} = profile
  const {title, shortDescription, description} = profile.description
  const {frequency} = time
  const {mode} = location

  return div(`.listing-card`, [
    div(`.info-card`, [
          div(`.heading`, [
            div(`.event-title`, [title]),
            !shortDescription ? null : div(`.short-description`, [shortDescription])
          ]),
          div(`.time`, [
            renderRecurrence(info)
          ]),
          renderLocation(info),
          renderCategories(info)
    ]),
    div(`#listingCardMapAnchor`),
    renderAdditionalInfo(info)
  ])
}


function renderSingle(info) {
  const {state} = info
  const {listing} = state
  const {type, profile} = listing
  const {meta, description, location, time} = profile
  const {title} = description
  const {frequency} = time
  const {mode} = location

  return div(`.listing-card`, [
      div(`.info-card`, [
        div([
          div([
            div(`.card-heading`, [
              div(`.event-title`, [title])
            ]),
            div(`.time`, [
              renderEventTime(info)
            ]),
            renderLocation(info),
            renderCategories(info)
          ])
        ])
      ]),
      div(`#listingCardMapAnchor`),
      renderAdditionalInfo(info)
    ])
}

function renderPanel(info) {
  const {state} = info
  const {listing} = state
  const {type} = listing
  return div(`.panel`, [
    div(`listing-map`, [
      type === `single`? 
        renderSingle(info)
        : type === `recurring` ? 
          renderRecurring(info)
          : renderGroup(info)
    ]) 
  ])


}

export default function view(state$, components) {
  return state$.withLatestFrom(combineObj(components), (state, components) => {
    const info = {state, components}
    return state.waiting ? div(`.panel.modal`, [`Waiting`]) : renderPanel(info)
  })
}
