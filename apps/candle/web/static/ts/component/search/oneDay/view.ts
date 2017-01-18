import {div, button, span, i, nav, a} from '@cycle/dom'
import {combineObj} from '../../../utils'
import moment = require('moment')
import {renderMenuButton, renderUserProfileButton, renderLoginButton} from '../../helpers/navigator'

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
      //return [`${dt.format('ddd')} (Yesterday)`, ".past"]
      return [`Yesterday`, ".past"]
    }

    return [`${dt.format('dd')} ${dt.format('M/D')}`, ".past"]

  } else if (selected.isSame(today)) {
    //return [`${dt.format('ddd')} (Today)`, ".today"]
    return [`Today`, ".today"]
  } else if (selected.isAfter(today)) {
    if (diff === 1) {
      //return [`${dt.format('ddd')} (Tomorrow)`, ".future"]
      return [`Tomorrow`, ".future"]
    }

    return [`${dt.format('dd')} ${dt.format('M/D')}`, ".future"]
  }
}

function renderDateController(state) {
  const dt = state.searchDateTime
  const [val, status] = getDateDisplayString(dt)
  return div(`.col-4.d-flex.justify-content-around.search-controller`, [
    button(`.appSubtractDay.nav-text-button.fa.fa-angle-left.btn.btn-link.float-xs-left`, []),
    val,
    button(`.appAddDay.nav-text-button.fa.fa-angle-right.btn.btn-link.d-flex.justify-content-end`),
    //button(`.appShowFilters.nav-text-button.filter-button.fa.fa-cog.btn.btn-link`)
  ])
}


function renderNavigator(state) {
  return nav('.navbar.navbar-light.bg-faded.container-fluid.fixed-top', [
    div('.row.no-gutter', [
      div('.col-4', [
        button('.appBrandButton.hopscotch-icon.btn.btn-link.nav-brand', []),
      ]),
      renderDateController(state),
      div('.col-4.d-flex.justify-content-end', [
        button('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link.d-flex.justify-content-end', []),
        //!authorization ?  button(`.appShowLoginButton.btn.btn-link.d-flex.justify-content-end`, [`Login`]) : null,
        //authorization ? button(`.appShowUserProfile.fa.fa-user-o.btn.btn-link.d-flex.justify-content-end.mr-4`, []) : null
      ]),
    ])
  ])
}

function renderContent(info) {
  const {state, components} = info
  const {showFilters} = state
  const {grid, filters} = components

  return div(`.content-section.nav-fixed-offset`, [ 
    grid,
  ])
}

function renderLoader() {
  return div('.loader', [])
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

    return div(`.screen.search-results.one-day`, {class: {"no-scroll": showFilters}}, [
      renderNavigator(state),
      showLoader(state) ? renderLoader() : renderContent(info),
      showFilters ? filters : null
    ])
  })
}

export default view

