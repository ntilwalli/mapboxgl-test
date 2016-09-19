import {div, span, h4} from '@cycle/dom'
import {combineObj} from '../../../utils'


function renderAddress(state) {
  const listing = state.listing
  const profile = listing.profile
  const location = profile.location
  const info = location.info

  return div(`.address`, [
    div(`.street`, [info.street]),
    div(`.street2`, [
      span(`.city`, [info.city]),
      span(`.state`, {style: {'padding-left': '5px'}}, [info.stateAbbr]),
      span(`.comma`, [`,`]),
      span(`.zip`, {style: {'padding-left': '5px'}}, [info.zipCode])
    ])
  ])
}

function renderMap(state) {
  const listing = state.listing
  const profile = listing.profile
  const location = profile.location
  return div(`.map.sub-section`, [
    div(`.location-info-section`, [
      renderAddress(state)
      // div(`.latitude-section`, [
      //   span(`.heading`, [`Latitude: `]),
      //   span([`${location.info.latLng.data.lat}`])
      // ]),
      // div(`.longitude-section`, [
      //   span(`.heading`, [`Longitude: `]),
      //   span([`${location.info.latLng.data.lng}`])
      // ])
    ]),
    div(`#modifyLocationMapAnchor`)
  ])
}

function renderPanel(state) {
  const {listing} = state

  return div(`.panel`, [
    div(`.panel-title`, [h4([`Confirm or adjust address location`])]),
    //renderAddress(state),
    renderMap(state)
  ])
}

export default function view(state$) {
  return state$.map(state => {
    return renderPanel(state)
  })
}
