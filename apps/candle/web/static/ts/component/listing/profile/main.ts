import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj} from '../../../utils'
import {createFeatureCollection} from '../../../mapUtils'
import Immutable = require('immutable')
import * as renderHelpers from '../../renderHelpers/listing'
import moment = require('moment')

const {renderName, renderDateTimeBegins, renderDateTimeEnds, renderCost, 
  renderStageTime, renderPerformerLimit, renderDonde, 
  renderStatus, renderSignup, renderNote, renderContactInfo, renderHostInfo} = renderHelpers

function intent(sources) {
  return {

  }
}

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$
    .map((info: any) => {
      const {listing, distance, status} = info
      return Immutable.Map(info)
    })
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function renderButtons(status, settings) {
  return div(`.buttons`, [
    div(`.appShare.enabled.share-button.flex-center`, [
      `Share`
    ]),
    div(`.appCheckIn.enabled.check-in-button.flex-center`, [
      `Check-in`
    ])
  ])
}

function renderSingleListing(state) {
  const {listing, status, settings} = state
  console.log(listing)
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
      const {listing, status, settings} = state
      const {type, donde} = listing
      //console.log(donde)
      return div(`.listing-profile`, [
        type === "single" ? renderSingleListing(state) : renderRecurringListing(state),
        renderButtons(status, settings),
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
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)
  const mapjson$ = mapview(state$)

  return {
    DOM: vtree$, //O.of(`Hello darling`),
    MapJSON: mapjson$
  }
}
