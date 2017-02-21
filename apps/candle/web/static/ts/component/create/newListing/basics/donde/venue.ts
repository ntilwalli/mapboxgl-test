import {Observable as O} from 'rxjs'

import {div, input, select, option, h5, li, span, strong, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy, spread} from '../../../../../utils'
import {toLngLatArray, createFeatureCollection} from '../../../../../mapUtils'

import {createVenueAutocomplete} from '../../../../../library/bootstrapVenueAutocomplete'
import {getVenueName, getVenueAddress, getVenueLngLat} from '../../../../../helpers/donde'

function reducers(actions, inputs) {
  const {selected$} = inputs
  const selected_r = selected$.map(val => state => {
    return state.set(`venue`, val)
  })

  const clear_r = actions.clear$.map(_ => state => {
    return state.set(`venue`, undefined)
  })

  return O.merge(
    selected_r, clear_r
  )
}

function model(action, inputs) {
  const {props$} = inputs
  const reducer$ = reducers(action, inputs)
  return props$
    .take(1)
    .map(props => {
      return {
        venue: props
      }
    })
    .switchMap(initialState => {
      return reducer$
        .startWith(Immutable.Map(initialState))
        .scan((state, f: Function) => f(state))
    })
    .map(x => (<any> x).toJS())
    //.do(x => console.log(`venue state`, x))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map((info: any) => {
      const {state, components} = info
      const {venue_autocomplete} = components
      const {venue} = state
      return div(`.row.venue`, [
        div(`.col-12`, [
          venue ? div('.row', [
             span(`.col-11.form-control-static.pt-0`, [
              strong('.mr-4', [getVenueName(venue)]),
              getVenueAddress(venue)
             ]),
            button(`.col-1.appClearVenueButton.close`, {style: {position: "relative", top: "-.375rem"}, attrs: {type: "button"}}, [])
          ]) : 
            //div(`.autocomplete`, [
              venue_autocomplete,
            //]),
          //]),
        venue ? //null
          div(`.row.map`, {style: {display: venue ? 'block' : 'none'}}, [
            div('.col-12', {style: {position: 'relative'}}, [
              div(`#basicsSelectVenueMapAnchor`, {key: "basicsSelectVenueMapAnchor"}),
              div(`.location-info`, [
                div(`.name`, [getVenueName(venue)]),
                div(`.address`, [getVenueAddress(venue)])
              ])
            ])
          ]) : null
      ])
    ])
  })
}

function mapview(state$) {
  return state$.map(state => {
    //console.log(`mapview`, state)
    const {venue} = state


    if (venue) {
      const {type, source, data, lng_lat} = venue
      const anchorId = `basicsSelectVenueMapAnchor`

      const descriptor = {
        controls: {},
        map: {
          container: anchorId, 
          style: `mapbox://styles/mapbox/bright-v9`, //stylesheet location
          center: toLngLatArray(lng_lat), // starting position
          zoom: 15, // starting zoom,
          dragPan: false,
          scrollZoom: false
        },
        sources: {
          venue: {
            type: `geojson`,
            data: createFeatureCollection(lng_lat, {
              title: getVenueName(venue),
              icon: `marker`
            })
          }
        },
        layers: {
          venue: {
            id: `venue`,
            type: `symbol`,
            source: `venue`,
            layout: {
                "icon-image": `{icon}-15`,
                "icon-size": 1.5,
                // "text-field": `{title}`,
                "text-font": [`Open Sans Semibold`, `Arial Unicode MS Bold`],
                "text-offset": [0, 0.6],
                "text-anchor": `top`
            }
          }
        },
        canvas: {
          style: {
            cursor: `grab`
          }
        }
      }

      return descriptor
    } else {
      return undefined
    }
  }).filter(x => !!x).delay(30)  // HACK! Belongs in mapboxgl driver, with proper fix. This arbitrary delay ensures root element 
                                 // which has been recreated by snabbdom is fully swapped out before the check for element existence 
                                 // is made... ensuring that the map is applied to the new dom element instead of the old one
                                 // 30 is arbitrary, 25 didn't work...
}

function applyChange(session, val) {
  session.listing.donde = val
}

export default function main(sources, inputs) {

  // console.log(`venue inputs...`, inputs)
  //const search_area$ = inputs.sear$.map(x => x.properties.donde.search_area)
  const props$ = (inputs.session$ ? inputs.session$.map(session => session.listing.donde) : O.of(undefined)).publishReplay(1).refCount()


  const venue_autocomplete = createVenueAutocomplete(sources, {...inputs, props$, search_area$: inputs.search_area$, highlight_error$$: inputs.highlight_error$$})

  const actions = {
    clear$: sources.DOM.select('.appClearVenueButton').events(`click`)
  }

  const state$ = model(actions, {
    props$,
    selected$: venue_autocomplete.output$
  })

  const to_http$ = venue_autocomplete.HTTP.publish().refCount()


  // to_http$.subscribe(x => {
  //   console.log('to_http...', x)
  // })

  const out = {
    DOM: view(state$, {venue_autocomplete$: venue_autocomplete.DOM}),
    MapJSON: mapview(state$)
      .delay(10)
      .map(x => {
        return x
      }),
    //Global: venue_autocomplete.Global,
    HTTP: to_http$,
    output$: state$.map(state => {
      return {
        data: state.venue,
        errors: [],
        valid: true,
        apply: applyChange
      }
    }).publishReplay(1).refCount()
  }

  //out.MapJSON.subscribe(x => console.log(`MapJSON`, x))

  return out
}
