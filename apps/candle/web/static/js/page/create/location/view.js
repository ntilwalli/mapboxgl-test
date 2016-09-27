import {Observable as O} from 'rxjs'
import {h, h3, h4, h5, h6, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {attrs, renderModal, combineObj} from '../../../utils'
import {getSearchAreaFromListing, getSearchAreaString} from './utils'

function renderSearchArea(info) {
  const {listing} = info.state
  const sa = getSearchAreaFromListing(listing)

  return div(`.search-area.sub-section`, [
    div(`.heading`, [h5([`Search area`])]),
    div(`.content`, [
      span([getSearchAreaString(sa)]),
      button(`.appChangeSearchAreaButton.link.change-button`, [`change`])
    ])
  ])
}

function renderLocationMode(info) {
  const {radio} = info.components
  return div(`.location-mode.sub-section`, [
    div(`.heading`, [h5([`Location type`])]),
    div(`.content`, [
      radio
    ])
  ])
}

function renderMapDisplay(info) {
  const {state} = info
  const location = state.listing.profile.location
  let mapDiv
  if (location.mode === `map`) {
    return div(`.map.sub-section`, [
      location.info ? div(`.location-info-section`, [
        div(`.latitude-section`, [
          span(`.heading`, [`Latitude: `]),
          span([`${location.info.latLng.lat}`])
        ]),
        div(`.longitude-section`, [
          span(`.heading`, [`Longitude: `]),
          span([`${location.info.latLng.lng}`])
        ])
      ]) : div(`.location-info-section`, [`Click map to select location`]),
      div(`#addEventMapAnchor`),
      location.info ? div(`.location-description.sub-section`, [
        div(`.heading`, [h5([`Describe the location (optional)`])]),
        div(`.content`, [
          input(`.appLocationDescription`, {props: {type: `text`, value: location.info.description || ``}})
        ])
      ]) : null
    ])
  } else if (location.mode === `venue` && location.info) {
    const data = location.info.data
    return div(`.map.sub-section`, [
      div(`.location-info-section`, [
        div(`.name`, [data.name]),
        div(`.address`, [data.address])
      ]),
      div(`#addEventMapAnchor`)
    ])
  } else { return null }


}

function renderPanel(info) {
  const state = info.state
  const {waiting, listing} = state
  const mode = listing.profile.location.mode
  const {radio, inputComponent, modal} = info.components

  if (waiting) {
    return div(`.panel.modal`, [`Waiting`])
  } else {
    return div(`.panel`, [
      div(`.panel-title`, [h4([`Where is the event?`])]),
      renderSearchArea(info),
      renderLocationMode(info),
      // This div below ensures the previous autocomplete box DOM is removed on mode switch and replaced fully
      // preventing erroneous DOM events
      inputComponent,
      modal
    ])
  }
}

// export default function view({state$, components}) {
//   return combineObj({state$, components: combineObj(components)}).map(info => {
//     return state.waiting ? div(`.panel.modal`, [`Waiting`]) :
//       renderPanel(state)
//   })
// }


export default function view(state$, components) {
  return combineObj({state$, components: combineObj(components)}).map(info => {
  //return state$.map(info => {
    return info.state.waiting ? div(`.panel.modal`, [`Waiting`]) : renderPanel(info)
    //return div([`Hello`])
  })
}
