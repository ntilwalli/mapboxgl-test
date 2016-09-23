import {Observable as O} from 'rxjs'
import {h, h3, h4, h5, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {combineObj} from '../../../utils'
import {getMomentFromCurrentDate, getMomentFromCurrentTime} from '../helpers'


// function renderHeading(val) {
//   return div(`.panel-title`, [h4([val])])
// }

// function renderInput(state) {
//   return div(`.date-picker.sub-section`, [
//     input(`.appDateInput.date-input`, {props: {type: `text`}})
//   ])
// }

// function renderEndDate(info) {
//   const {state, components} = info
//   const {endDate} = components
//   const listing = state.listing
//   const {profile} = listing
//   const section = `time`
//   const property = `end`
//   // const disabled = isDisabled(section, property, listing)
//   // if (!disabled) {
//     return div(`.start-date-time`, [
//       renderHeading(`End`, section, property, listing),
//       endDate
//     ])
//   // } else {
//   //   return null
//   // }
// }

export function renderHeading(val, optional = false) {
  return div(`.panel-title`, [
    h5([`${val}${optional ? ' (optional)': ''}`])
  ])
}

function renderFrequency(info) {
  const {state, components} = info
  const {frequency} = components
  return div(`.frequency-section`, [
      renderHeading(`Frequency`),
      frequency
    ])
}

function renderStartDate(info) {
  const {state, components} = info
  const {time} = state.listing.profile
  const {startDate} = time
  return div(`.start-date-section`, [
      renderHeading(`Start date`),
      span(`.date-display`, [
        !startDate ? span(`.no-date-selected`, [`Not selected`]) : 
          span(`.date-selected`, [getMomentFromCurrentDate(startDate).format("dddd, MMMM Do YYYY")]),
        span(`.appChangeStartDate.change-button`, [`change`])
      ])
    ])
}

function renderUntilDate(info) {
  const {state, components} = info
  const {time} = state.listing.profile
  const {until} = time
  return div(`.until-date-section`, [
      renderHeading(`Recurs until (optional)`),
      span(`.date-display`, [
        !until ? span(`.no-date-selected`, [`Not selected`]) : 
          span(`.date-selected`, [getMomentFromCurrentDate(until).format("dddd, MMMM Do YYYY")]),
        span(`.appChangeUntilDate.change-button`, [`change`])
      ])
    ])
}

function renderStartTime(info) {
  const {state, components} = info
  const {time} = state.listing.profile
  const {startTime} = time
  return div(`.start-time-section`, [
      renderHeading(`Start time`),
      span(`.time-display`, [
        !startTime ? span(`.no-time-selected`, [`Not selected`]) : 
          span(`.time-selected`, [getMomentFromCurrentTime(startTime).format(`h:mm a`)]),
        span(`.appChangeStartTime.change-button`, [`change`])
      ])
    ])
}

function renderEndTime(info) {
  const {state, components} = info
  const {time} = state.listing.profile
  const {endTime} = time
  return div(`.end-time-section`, [
      renderHeading(`End time (optional)`),
      span(`.time-display`, [
        !endTime ? span(`.no-time-selected`, [`Not selected`]) : 
          span(`.time-selected`, [getMomentFromCurrentTime(endTime).format(`h:mm a`)]),
        span(`.appChangeEndTime.change-button`, [`change`])
      ])
    ])
}

function renderPanel(info) {
  const {state, components} = info
  const {frequency} = components
  return div(`.panel`, [
      div(`.panel-title`, [h4([`Recurring how/when?`])]),
      renderFrequency(info),
      renderStartDate(info),
      div(`.time-input-container`, [
        renderStartTime(info),
        renderEndTime(info)
      ]),
      renderUntilDate(info),
      components.modal
    ])
}

export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(16)
    .map(inputs => {
    return renderPanel(inputs)
  })
}
