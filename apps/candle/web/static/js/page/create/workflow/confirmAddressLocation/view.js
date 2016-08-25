import xs from 'xstream'
import {h, h3, h4, h5, h6, nav, ul, li, div, a, i, span, button, input, p} from '@cycle/dom'
import combineObj from 'xs-combine-obj'
import {attrs} from '../../../utils'


function renderAddress(state) {
  const location = state.listing.location
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
  const location = state.listing.location
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

  return div(`.input-section`, [
    div(`.form-section`, [
      div(`.empty-section`),
      div(`.content-section`, [
        div(`.panel`, [
          div(`.panel-title`, [h4([`Confirm or adjust address location`])]),
          //renderAddress(state),
          renderMap(state)
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
        button(`.appNextButton.next-button`, [
          span(`.next-text`, [`Next`]),
          span(`.fa.fa-angle-right`)
        ])
      ])
    ])
  ])
}

// export default function view({state$, components}) {
//   return combineObj({state$, components: combineObj(components)}).map(info => {
//     return state.waiting ? div(`.panel.modal`, [`Waiting`]) :
//       renderPanel(state)
//   })
// }


export default function view(state$) {
  return state$.map(state => {
    return renderPanel(state)
  })
}
