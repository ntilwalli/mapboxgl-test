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
import {getSearchAreaFromMapLocation, getSearchAreaString} from '../utils'

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
  const dragStart$ = MapDOM.chooseMap(`changeSearchAreaMapAnchor`).select(`.changeSearchArea`).events(`dragstart`)
  const moveEnd$ = MapDOM.chooseMap(`changeSearchAreaMapAnchor`).select(`.changeSearchArea`).events(`moveend`)
  const mapCenterZoom$ = dragStart$.switchMap(_ => {
    return moveEnd$.take(1)
  }).map(getCenterZoom)
    .publish().refCount()

  const regionService = FactualGeotagService({props$: O.of({category: 'geotag from searchArea'}), latLng$: mapCenterZoom$.map(x => x.center), HTTP: sources.HTTP})
  const mapSearchArea$ = regionService.result$
    .withLatestFrom(mapCenterZoom$.do(x => console.log(`B`)), (region, position) => {
      return {region, center: position.center}
    })
    .map(getSearchAreaFromMapLocation)
    .publish().refCount()

  return {
    mapSearchArea$,
    toHTTP$: regionService.HTTP
  }
}

function reducers(actions, inputs) {
  
  const searchAreaReducer$ = O.merge(
    actions.mapSearchArea$,
    inputs.inputSearchArea$ || O.never()
  )
  .map(v => state => {
    const sa = state.get(`searchArea`, state)
    sa.center = v.center
    sa.region = v.region
    return state.set(`searchArea`, sa)
  })

  return O.merge(
    searchAreaReducer$
  )
}

function model(actions, inputs) {
  const {listing$} = inputs
  return listing$
    .take(1)
    .switchMap(listing => {
      const searchArea = listing.profile.searchArea
      const v = searchArea.region.type === `somewhere` ? searchArea : undefined
      const initialState = {
        searchArea: searchArea
      }

      return reducers(actions, inputs)
        .startWith(Immutable.Map(initialState))
        .scan((state, reducer) => reducer(state))
    })
    .map(x => x.toJS())
    .do(x => console.log(`searchArea state...`, x))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
}

function renderSearchAreaModalBody(info) {
  const {state, components} = info
  return div(`.change-search-area-modal`, [
    components.autocomplete,
    div(`.map.sub-section`, [
      div(`.location-info-section`, [getSearchAreaString(state.searchArea)]),
      div(`#changeSearchAreaMapAnchor`)
    ])
  ])
}

function view({state$, components}) {
  return combineObj({state$, components$: combineObj(components)}).map(info => {
    return renderSearchAreaModalBody(info)
  })
}

function mapView(state$) {
  return state$.map(state => {
    const searchArea = state.searchArea
    const anchorId = `changeSearchAreaMapAnchor`

    const centerZoom = {
      center: [searchArea.center.lat, searchArea.center.lng],
      zoom: 12
    }

    const properties = {
      attributes: {
        class: `changeSearchArea`
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

  const {listing$} = inputs
  const actions = intent(sources, inputs)

  const inputSearchArea$ = createProxy()
  const center$ = O.merge(
    listing$.take(1).map(v => v.profile.searchArea.center),
    actions.mapSearchArea$.map(v => v.center),
    inputSearchArea$.map(x => x.center)
  )

  const state$ = model(actions, spread({inputSearchArea$}, inputs))

  const populatedPlaceInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => ArcGISSuggest(sources, {
        props$: combineObj({
          countryCode$: state$.map(s => s.country).distinctUntilChanged(),
          category: O.of('Populated+Place')
        }),
        center$: center$.distinctUntilChanged(),
        input$: inputs.input$.distinctUntilChanged()
      }),
    itemConfigs,
    displayFunction: x => x.name,
    placeholder: `Drag map or type city/state here...`
  })

  const magicKeyConverter = ArcGISGetMagicKey(sources, {
    props$: O.of({
      category: `location search area`
    }),
    input$: populatedPlaceInput.selected$
  })

  inputSearchArea$.attach(magicKeyConverter.result$
    .do(x => {
      console.log(`magic key result`, x)
    }))

  const out = {
    DOM: view({state$, components: {autocomplete$: populatedPlaceInput.DOM}}),
    MapDOM: mapView(state$),
    HTTP: O.merge(populatedPlaceInput.HTTP, magicKeyConverter.HTTP, actions.toHTTP$).publishReplay(1).refCount(),
    output$: state$.map(x => x.searchArea)
  }

  return out
}