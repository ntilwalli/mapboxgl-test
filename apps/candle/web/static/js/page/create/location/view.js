import {Observable as O} from 'rxjs'
import {h, h3, h4, h5, h6, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {attrs, renderModal, combineObj} from '../../../utils'
import {getVicinityFromListing, getVicinityString} from './utils'

function renderVicinity(info) {
  const {geolocation, listing} = info.state
  const vicinity = getVicinityFromListing(listing, geolocation)

  return div(`.vicinity.sub-section`, [
    div(`.heading`, [h5([`Vicinity`])]),
    div(`.content`, [
      span([getVicinityString(vicinity)]),
      button(`.appChangeVicinityButton.link.change-button`, [`change`])
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

function renderVicinityModalBody(state) {
  return div([`Hello`])
}

function renderChangeRegionScreen({state, components}) {
  const show = state.showVicinityScreen
  return div(`.change-region-screen`, [
    div(`.modal-backdrop.fade.in${ show ? '.show' : '' }`),
    show ? div(`.appModal.modal.fade.in.show`, [
      components.vicinityScreen
    ]) : null
  ])
}

function renderPanel(info) {
  const state = info.state
  const {waiting, listing} = state
  const mode = listing.profile.location.mode
  const {radio, venueAutocomplete, addressAutocomplete, addressInput} = info.components

  if (waiting) {
    return div(`.panel.modal`, [`Waiting`])
  } else {
    return div(`.input-section`, [
      div(`.form-section`, [
        div(`.empty-section`),
        div(`.content-section`, [
          div(`.panel`, [
            div(`.panel-title`, [h4([`Where is the event?`])]),
            renderVicinity(info),
            renderLocationMode(info),
            // This div below ensures the previous autocomplete box DOM is removed on mode switch and replaced fully
            // preventing erroneous DOM events
            div(`.${mode}`, [
              mode === `venue` ? venueAutocomplete : mode === `address` ? addressInput : null,
            ]),
            renderMapDisplay(info)
          ])
        ])
      ])
      , div(`.controller-section`, [
        div(`.separator`),
        div(`.button-section`, [
          button(`.appBackButton.back-button`, [
            span(`.fa.fa-angle-left`),
            span(`.back-text`, [`Back`])
          ]),
          button(`.appNextButton.next-button${state.valid ? '' : '.disabled'}`, [
            span(`.next-text`, [`Next`]),
            span(`.fa.fa-angle-right`)
          ])
        ])
      ]),
      renderChangeRegionScreen(info)
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
