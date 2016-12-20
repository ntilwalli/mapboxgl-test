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
  return div(`.search-controller.clearfix`, [
    button(`.appSubtractDay.fa.fa-angle-left.btn.btn-link.float-xs-left`, []),
    val,
    button(`.appAddDay.fa.fa-angle-right.btn.btn-link.float-xs-right`),
    button(`.appShowFilters.filter-button.fa.fa-cog.btn.btn-link`)
  ])
}

// function renderNavigator(state) {
//   const {authorization} = state
//   const authClass = authorization ? `Logout` : `Login`
//   return div(`.navigator-section`, [
//     div(`.section`, [
//       renderMenuButton()
//     ]),
//     div(`.section`, [
//       //`Hello`,
//       renderDateController(state),
//       renderFiltersController(state)
//     ]),
//     div(`.section`, [
//       !authorization ? renderLoginButton() : null,
//       authorization ? renderUserProfileButton() : null
//     ])
//   ])
// }



function renderNavigator(state) {
  const {authorization} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid.pos-f-t', [
    div('.row.no-gutter', [
      div('.col-xs-4', [
        button('.appBrandButton.hopscotch-icon.btn.btn-link.nav-brand', []),
      ]),
      div('.col-xs-4', [
        renderDateController(state),
      ]),
      div('.col-xs-4', [
        button('.appShowMenuButton.fa.fa-bars.btn.btn-link.float-xs-right', []),
        //!authorization ?  button(`.appShowLoginButton.btn.btn-link.float-xs-right`, [`Login`]) : null,
        //authorization ? button(`.appShowUserProfile.fa.fa-user-o.btn.btn-link.float-xs-right.mr-1`, []) : null
      ]),
    ])
  ])
}

function renderContent(info) {
  const {state, components} = info
  const {showFilters} = state
  const {grid, filters} = components

  return div(`.content-section`, [ 
    showLoader(state) ? renderLoader() : grid,
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
      renderContent(info),
      showFilters ? filters : null
    ])
  })
}

export default view

