import {Observable as O} from 'rxjs'
import {div, button} from '@cycle/dom'
import {combineObj, processHTTP, spread, createProxy} from '../../../utils'
import {geoToLngLat} from '../../../mapUtils'
import {createFeatureCollection} from '../../../mapUtils'
import Immutable = require('immutable')
import * as renderHelpers from '../../renderHelpers/listing'
import moment = require('moment')

const {renderName, renderDateTimeBegins, renderDateTimeEnds, renderCost, 
  renderStageTime, renderPerformerLimit, renderDonde, 
  renderStatus, renderSignup, renderNote, renderContactInfo, renderHostInfo} = renderHelpers

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `checkInToEvent`)
  const checkin_success$ = good$.filter(onlySuccess)
  const checkin_failure$ = bad$.filter(onlyError)

  const checkin$ = DOM.select(`.appCheckin`).events(`click`)
      .publishReplay(1).refCount()

  return {
    checkin$,
    checkin_success$,
    checkin_failure$
  }
}

function reducers(actions, inputs) {

  const in_flight_r = inputs.in_flight$.map(_ => state => {
    return state.set(`in_flight`, true)
  })

  const checkin_success_r = actions.checkin_success$.map(_ => state => {
    console.log(`HTTP Success`, _)
    return state.set(`checked_in`, true)
      .set(`in_flight`, false)
  })

  const checkin_failure_r = actions.checkin_failure$.map(_ => state => {
    return state.set(`in_flight`, false)
  })

  return O.merge(
    in_flight_r, checkin_success_r, checkin_failure_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    props$: inputs.props$,
    authorization$: inputs.Authorization.status$,
    geolocation$: inputs.Geolocation.geolocation$
  })
    .map((info: any) => {
      const {props, authorization, geolocation} = info
      const {listing, distance, status} = props
      return Immutable.Map(spread(info, {
        authorization,
        geolocation,
        listing,
        distance,
        checked_in: !!(status && status.checked_in),
        in_flight: false
      }))
    })
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function renderButtons(authorization, checked_in, settings) {
  const disabled = authorization ? false : true

  return div(`.buttons`, [
    button(`.appShare.disabled.share-button.flex-center`, {
      class: {
        disabled: true
      },
      attrs: {
        disabled: true
      }
    }, [
      `Share`
    ]),
    button(`.appCheckin.check-in-button.flex-center`, {
      class: {
        disabled
      },
      attrs: {
        disabled
      }
    }, [
      `Check-in`
    ])
  ])
}

function renderSingleListing(state) {
  const {authorization, listing, checked_in, settings} = state

  const {name, cuando, donde, meta} = listing
  const {begins, ends} = cuando
  const {hosts, contact, cost, sign_up, stage_time, performer_limit, note} = meta
  return div(`.info`, [
    div(`.top`, [
      div(`.left`, [
        renderName(name),
        renderDateTimeBegins(cuando),
        renderDateTimeEnds(cuando),
        renderDonde(donde),
        renderContactInfo(contact),
        renderHostInfo(hosts)
      ]),
      div(`.right`, [
        renderStatus(cuando),
        renderCost(cost),
        renderStageTime(stage_time),
        renderSignup(cuando, sign_up),
        renderPerformerLimit(performer_limit),
      ])
    ]),
    div(`.bottom`, [
      renderNote(note),
    ])

    // renderCheckin(meta),
    // renderHosts(meta)
  ])
}

function renderRecurringListing(listing) {
  return div([`Recurring`])
}

function renderMarkerInfo(donde) {
  return div(`.marker-info`, [
    renderDonde(donde)
    //donde.name
  ])
}

function view(state$) {
  return state$
    .map(state => {
      console.log(state)
      const {authorization, listing, checked_in, settings} = state
      const {type, donde} = listing
      //console.log(donde)
      return div(`.listing-profile`, [
        type === "single" ? renderSingleListing(state) : renderRecurringListing(state),
        renderButtons(authorization, checked_in, settings),
        div(`.map`, [
          renderMarkerInfo(donde),
          div(`#listing-location-map`)
        ])
      ])
    })
}

function mapview(state$) {
  return state$
    .map(state => {
      const {listing} = state
      const donde = listing.donde
      const {lng, lat} = donde.lng_lat
      const anchorId = `listing-location-map`
      let zoom = 15
      const center = [lng, lat]
      const tile = `mapbox://styles/mapbox/bright-v9`

      const descriptor = {
        controls: {},
        map: {
          container: anchorId, 
          style: tile,
          center,
          zoom,
          dragPan: true
        },
        sources: {
          marker: {
            type: `geojson`,
            data: createFeatureCollection(donde.lng_lat, {
              icon: `marker`
            })
          }
        },
        layers: {
          marker: {
            id: `marker`,
            type: `symbol`,
            source: `marker`,
            layout: {
                "icon-image": `{icon}-15`,
                "icon-size": 1.5,
                // "text-field": `{title}`,
                "text-font": [`Open Sans Semibold`, `Arial Unicode MS Bold`],
                "text-offset": [0, 0.6],
                "text-anchor": `top`
            }
          }
        }
      }

      return descriptor
    })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const in_flight$ = createProxy()
  const state$ = model(actions, spread(inputs, {in_flight$}))
  const vtree$ = view(state$)
  const mapjson$ = mapview(state$)

  const to_http$ = actions.checkin$.withLatestFrom(state$, (_, state) => {
    const {geolocation, listing} = state
    if (geolocation.type === `position`) {
      const lng_lat = geoToLngLat(geolocation)
      return {
        url: `/api/checkin`,
        method: `post`,
        send: {
          listing_id: listing.id,
          lng_lat
        },
        category: `checkInToEvent`
      }
    } else {
      return null
    }
  }).filter(x => !!x)
    .do(x => console.log(`checkin request`, x))
    .publishReplay(1).refCount()
  
  in_flight$.attach(to_http$)

  return {
    DOM: vtree$,
    MapJSON: mapjson$,
    HTTP: to_http$
  }
}
