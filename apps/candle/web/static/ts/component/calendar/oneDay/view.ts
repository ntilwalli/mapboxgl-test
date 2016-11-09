import {div, button, span, i} from '@cycle/dom'
import {combineObj} from '../../../utils'
import moment = require('moment')

const showLoader = state => {
  const {results, retrieving, searchPosition} = state
  return !Array.isArray(results) //|| retrieving
}

function getDateDisplayString(dt) {
  const today = moment().startOf('day')
  const selected = dt.clone().startOf('day')
  //console.log(`isBefore?`, selected.isBefore(today))
  const diff = selected.diff(today, `days`)
  //console.log(diff)
  if (selected.isBefore(today)) {
    if (diff === -1) {
      return [`${dt.format('dddd')} (Yesterday)`, ".past"]
    }

    return [`${dt.format('dddd')} (${dt.format('M/D/YY')})`, ".past"]

  } else if (selected.isSame(today)) {
    return [`${dt.format('dddd')} (Today)`, ".today"]
  } else if (selected.isAfter(today)) {
    if (diff === 1) {
      return [`${dt.format('dddd')} (Tomorrow)`, ".future"]
    }

    return [`${dt.format('dddd')} (${dt.format('M/D/YY')})`, ".future"]
  }
}

function renderDateDisplay(state) {
  //console.log(state.searchDateTime)
  const dt = state.searchDateTime
  const [val, status] = getDateDisplayString(dt)

  return span(`.date-display${status}`, [val])
}

function renderDateController(state) {
  return span(`.date-controller`, [
    button(`.appSubtractDay.subtract-day.fa.fa-angle-left.fa-1-5x`),
    renderDateDisplay(state), //span(`.date-display`[`This is the controller`]),
    button(`.appAddDay.add-day.fa.fa-angle-right.fa-1-5x`)
  ])
}

function renderFiltersController(state) {
  return span(`.filter-controller`, [
    button(`.appShowFilters.show-filters.fa.fa-cog.fa-1-2x`)
  ])
}

function renderMenuButton(state) {
  return span(`.menu-button`, [
    i(`.appMenuButton.fa.fa-bars.fa-1-2x`, [])
  ])
}

function renderController(state) {
  const {authorization} = state
  const authClass = authorization ? `Logout` : `Login`
  return div(`.controller`, [
    div(`.section`, [
      renderMenuButton(state)
    ]),
    div(`.section`, [
      renderDateController(state),
      renderFiltersController(state)
    ]),
    div(`.section`, [
      button(`.appShow${authClass}Button.auth-button`, {key: `oneDayController${authClass}`}, [authClass])
    ])
  ])
}

function renderLoader() {
  return div(`.retrieving-panel`, [
    div(`.loader-container`, [
      div(`.loader`)
    ])
  ])
}

function view(state$, components) {
  return combineObj({
    state$,
    components$: combineObj(components)
  })
  .debounceTime(0)
  .map((info: any) => {
    const {state, components} = info
    const {showFilters} = state
    const {grid, filters} = components

    return div(`.one-day-calendar`, {class: {"no-scroll": showFilters}}, [
      renderController(state),
      showLoader(state) ? renderLoader() : grid,
      showFilters ? filters : null
    ])
  })
}

export default view
