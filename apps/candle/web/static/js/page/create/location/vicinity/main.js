import {Observable as O} from 'rxjs'
import {div, input, select, option, h5, li, span, button} from '@cycle/dom'
import Immutable from 'immutable'
import {combineObj, createProxy, spread} from '../../../../utils'
import {countryToAlpha2} from '../../../../util/countryCodes'
import {getCenterZoom} from '../../../../util/map'
import {getState} from '../../../../util/states'

import AutocompleteInput from '../../../../library/autocompleteInput'
import ArcGISSuggest from '../../../../thirdParty/ArcGISSuggest'
import ArcGISGetMagicKey from '../../../../thirdParty/ArcGISGetMagicKey'
import FactualGeotagService from '../../../../thirdParty/FactualGeotagService'
import {getVicinityFromMapLocation, getVicinityString} from '../utils'

import VirtualDOM from 'virtual-dom'
const VNode = VirtualDOM.VNode

const itemConfigs = {
  default: {
    selectable: true,
    renderer: (suggestion, index, highlighted) => {
      return li(
        `.populated-place-autocomplete-item.autocomplete-item-style.custom-autocomplete-input-style.${highlighted ? '.light-gray' : ''}`,
        {attrs: {'data-index': index}},
        [
          span(`.populated-place-info`, [suggestion.name])
        ]
      )
    }
  }
}


function intent(sources, inputs) {
  const {DOM, MapDOM} = sources
  const mapMove$ = MapDOM.chooseMap(`changeVicinityMapAnchor`).select(`.changeVicinity`).events(`moveend`)
     .map(getCenterZoom)
     .cache(1)

  const regionService = FactualGeotagService({props$: O.of({category: 'geotag from vicinity'}), latLng$: mapMove$.map(x => x.center), HTTP: sources.HTTP})
  const mapVicinity$ = regionService.result$
    .switchMap(region => {
      return mapMove$.take(1).map(position => ({region, position}))
    })
    .map(getVicinityFromMapLocation)

  return {
    mapVicinity$,
    toHTTP$: regionService.HTTP
  }
}

function reducers(actions, inputs) {
  const vicinityReducer$ = O.merge(
    //actions.mapVicinity$,
    inputs.inputVicinity$
  )
  .map(v => state => {
    return state.set(`vicinity`, v)
  })

  return O.merge(
    vicinityReducer$
  )
}



function model(actions, inputs) {
  const {geolocation$} = inputs
  return combineObj({
      vicinity$: geolocation$.take(1)
    })
    .switchMap(({vicinity}) => {
      const v = vicinity.region.type === `somewhere` ? vicinity : undefined
      const initialState = {
        vicinity: vicinity
      }

      return reducers(actions, inputs)
        .startWith(Immutable.Map(initialState))
        .scan((state, reducer) => reducer(state))
    })
    .map(x => x.toJS())
    .do(x => console.log(`vicinity state...`, x))
    .map(x => {
      return x
    })
    .cache(1)
}

function renderVicinityModalBody(state, components) {
  return div(`.change-vicinity-modal`, [
    components.autocomplete,
    div(`.map.sub-section`, [
      div(`.location-info-section`, [getVicinityString(state.vicinity)]),
      div(`#changeVicinityMapAnchor`)
    ])
  ])
}

function view({state$, components}) {
  return combineObj({state$, components$: combineObj(components)}).map(({state, components}) => {
    return renderVicinityModalBody(state, components)
  })
}

function mapView(state$) {
  return state$.map(state => {
    const vicinity = state.vicinity
    const anchorId = `changeVicinityMapAnchor`

    const centerZoom = {
      center: [vicinity.position.lat, vicinity.position.lng],
      zoom: 12//vicinity.position.zoom
    }

    const properties = {
      attributes: {
        class: `changeVicinity`
      },
      centerZoom,
      disablePanZoom: false,
      anchorId,
      mapOptions: {zoomControl: true}
    }

    const tile = `mapbox.streets`

    return new VNode(`map`, properties, [
      new VNode(`tileLayer`, { tile })
    ])
  })
}

export default function main(sources, inputs) {

  const {geolocation$} = inputs
  const actions = intent(sources, inputs)

  const inputVicinity$ = createProxy()
  const center$ = O.merge(
    geolocation$.map(v => v.position),
    actions.mapVicinity$.map(v => v.position.center),
    inputVicinity$
  )

  //const autocomplete$ = createProxy()

  //const state$ = model(actions, {autocomplete$, inputVicinity$, ...inputs})
  const state$ = model(actions, spread({inputVicinity$}, inputs))

  const populatedPlaceInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => ArcGISSuggest(sources, {
        props$: combineObj({
          countryCode$: state$.map(s => s.country),
          category: O.of('Populated+Place')
        }),
        center$,
        input$: inputs.input$
      }),
    itemConfigs,
    displayFunction: x => x.name,
    placeholder: `Drag map or type city/state here...`
  })

  const magicKeyConverter = ArcGISGetMagicKey(sources, {
    props$: O.of({}),
    input$: populatedPlaceInput.selected$
  })

  inputVicinity$.attach(magicKeyConverter.result$
    .filter(x => x.type === `success`)
    .map(x => x.data)
    .map(x => {
      let match
      let vicinity
      if (match = x.address.match(/^(.*),(.*),(.*)$/)) {
        const city = match[1].trim()
        const state = match[2].trim()
        const country = match[3].trim()
        vicinity = {
          region: {
            type: `somewhere`,
            data: {
              raw: x.address,
              city: city,
              state: state,
              country: country,
              cityAbbr: undefined,
              stateAbbr: getState(state),
              countryAbbr: countryToAlpha2(country)
            }
          },
          position: {
            center: x.latLng
            //zoom: 8
          }
        }
      } else if (match = x.address.match(/^(.*),(.*)$/)) {
        const state = match[1].trim()
        const country = match[2].trim()
        vicinity = {
          region: {
            type: `somewhere`,
            data: {
              raw: x.address,
              city: undefined,
              state: state,
              country:  country,
              cityAbbr: undefined,
              stateAbbr: getState(state),
              countryAbbr: countryToAlpha2(country)
            }
          },
          position: {
            center: x.latLng
            //zoom: 11
          }
        }
      } else {
        vicinity = {
          region: {
            type: `somewhere`,
            data: {
              raw: x.address,
              city: undefined,
              state: undefined,
              country: undefined,
            }
          },
          position: {
            center: x.latLng
            //zoom: 7
          }
        }
      }
      //console.log(x)
      return vicinity
    }))

  return {
    DOM: view({state$, components: {autocomplete$: populatedPlaceInput.DOM}}),
    MapDOM: mapView(state$),
    HTTP: O.merge(populatedPlaceInput.HTTP, magicKeyConverter.HTTP, actions.toHTTP$),
    result$: state$.map(x => x.vicinity)
  }
}
