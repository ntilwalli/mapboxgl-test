import {Observable as O} from 'rxjs'
import {h, h3, h4, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {combineObj} from '../../../utils'
import {renderHeading} from '../helpers'


// function renderHeading(val) {
//   return div(`.panel-title`, [h4([val])])
// }

// function renderInput(state) {
//   return div(`.date-picker.sub-section`, [
//     input(`.appDateInput.date-input`, {props: {type: `text`}})
//   ])
// }

function renderStartDate(info) {
  const {state, components} = info
  const {startDate} = components
  const listing = state.listing
  const {profile} = listing
  const section = `time`
  const property = `start`
  // const disabled = isDisabled(section, property, listing)
  // if (!disabled) {
    return div(`.start-date-time`, [
      renderHeading(`Start`, section, property, listing),
      startDate
    ])
  // } else {
  //   return null
  // }
}

function renderEndDate(info) {
  const {state, components} = info
  const {endDate} = components
  const listing = state.listing
  const {profile} = listing
  const section = `time`
  const property = `end`
  // const disabled = isDisabled(section, property, listing)
  // if (!disabled) {
    return div(`.start-date-time`, [
      renderHeading(`End`, section, property, listing),
      endDate
    ])
  // } else {
  //   return null
  // }
}


function renderPanel(info) {
  return div(`.panel`, [
      div(`.panel-title`, [h4([`When?`])]),
      renderStartDate(info),
      renderEndDate(info)
    ])
}


export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)}).map(inputs => {
    return renderPanel(inputs)
  })
}
