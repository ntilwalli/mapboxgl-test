import {Observable as O} from 'rxjs'
import {div, span, button, nav, a, em, ul, li} from '@cycle/dom'
import {combineObj, processHTTP, createProxy} from '../../../utils'
import {createFeatureCollection, geoToLngLat} from '../../../mapUtils'
import Immutable = require('immutable')
import moment = require('moment')
import * as Geolib from 'geolib'

import {
  renderName, renderNameWithParentLink, renderCuando, renderDonde, 
  renderCuandoStatus, renderCost, renderStageTime, renderPerformerSignup,
  renderPerformerLimit, renderTextList, renderNote, getFullCostAndStageTime,
  renderContactInfo
}  from '../../helpers/listing/renderBootstrap'


const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `checkInToEvent`)
  const checkin_success$ = good$
    //.do(x => console.log(`success`, x))
    .filter(onlySuccess)
  const checkin_failure$ = good$
    //.do(x => console.log(`error`, x))
    .filter(onlyError)

  const checkin$ = DOM.select(`.appCheckin`).events(`click`)
      .publishReplay(1).refCount()

  const to_parent$ = DOM.select(`.appGoToParent`).events('click')


  return {
    checkin$,
    checkin_success$,
    checkin_failure$,
    to_parent$,
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
    console.log(`HTTP Error`, _)
    return state.set(`in_flight`, false)
  })

  const geolocation_r = inputs.geolocation$.skip(1).map(geo => state => {
    return state.set(`geolocation`, geo)
  })

  return O.merge(
    in_flight_r, checkin_success_r, checkin_failure_r, geolocation_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    props$: inputs.props$,
    authorization$: inputs.Authorization.status$,
    geolocation$: inputs.geolocation$.take(1)
  })
    .map((info: any) => {
      const {props, authorization, geolocation} = info
      const {listing, children, distance, status} = props
      return Immutable.Map({
        ...info, 
        authorization,
        geolocation,
        listing,
        children,
        distance,
        checked_in: !!(status && status.checked_in),
        in_flight: false
      })
    })
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`profile state:`, x))
    .publishReplay(1).refCount()
}


function renderMarkerInfo(donde) {
  return div(`.marker-info`, [
    renderDonde(donde)
    //donde.name
  ])
}

const convertLngLat = x => ({longitude: x.lng, latitude: x.lat})

function renderButtons(state) {
  const {geolocation, authorization, listing, checked_in, in_flight} = state
  const {donde, cuando, settings} = listing
  const check_in_settings = settings.check_in
  const checkin_begins = cuando.begins.clone().add(check_in_settings.begins || -30, 'minutes')
  const checkin_ends = settings.ends || cuando.begins.clone().add(check_in_settings.ends || 120, 'minutes')
  const checkin_radius = check_in_settings.radius || 30
  
  let disabled = true;

  // console.log(geolocation)
  const valid_geo = geolocation.type === "position"
  if (authorization && valid_geo) {
    //console.log(settings)

    // console.log(geolocation)
    // console.log(donde.lng_lat)
    const userLL = convertLngLat(geoToLngLat(geolocation))
    const dondeLL = convertLngLat(donde.lng_lat)
    const distance = Geolib.getDistance(userLL, dondeLL)
    //console.log(`User distance: `, distance)
    const within_radius = distance <= checkin_radius
    //console.log(`Within radius: `, within_radius)
    const now = moment()
    const within_time_window = now.isSameOrAfter(checkin_begins) && now.isSameOrBefore(checkin_ends)
    //console.log(`Within time window: `, within_time_window)

    disabled = checked_in //|| !(within_radius && within_time_window ) ? true : false
    //console.log(`check-in disabled: `, disabled)
  }

  //enabled, disabled, checked-in


  return button(`.appCheckin.check-in-button.col-xs-12.float-xs-right.btn.btn-success.mt-1`, {
      class: {
        disabled,
        enabled: !disabled,
      },
      attrs: {
        type: 'button',
        disabled
      }
    }, [
      in_flight? span(`.loader`, []) : checked_in ? span(`.flex-center.button-text`, [`Checked-in`]) : span(`.flex-center.button-text`, [`Check-in`])
    ])
  
}

function renderUpcomingEvents(children) {
  const heading = [
    li('.list-group-item', [em(['Upcoming dates'])])
  ]

  const child_events = children
    .filter(x => x.cuando.begins > moment())
    .sort((x, y) => x.cuando.begins - y.cuando.begins)
    .slice(0, 5)
    .map(child => {
      return li(`.list-group-item`, [
        a('.btn.btn-link', {attrs: {href: '/listing/' + child.id}, props: {listing: child}}, [child.cuando.begins.format('ddd, M/D/YY h:mm a')])
      ])
    })

  return ul(`.list-group.upcoming-dates`, heading.concat(child_events))
}



export function renderRecurringListing(state) {

  const {listing, children} = state
  const {type, donde, cuando, meta} = listing
  const {
    name, event_types, categories, notes, 
    performer_cost, description, contact_info, 
    performer_sign_up, stage_time, 
    performer_limit, listed_hosts, note
  } = meta

  const new_note = note.replace(/\n/g, ' ')

  const [full_cost, full_stage_time, merged_cost_stage_time] = 
    getFullCostAndStageTime(performer_cost, stage_time)

  return div('.container-fluid.nav-fixed-offset.mt-xs', [
    div('.row.mb-1', [
      div('.col-xs-6', [
        div('.row.no-gutter', [
          renderName(name)
        ]),
        div('.row.no-gutter', [
          renderCuando(listing)
        ]),
        div('.row.no-gutter', [
          renderDonde(donde)
        ]),
        renderContactInfo(contact_info),
      ]),
      div('.col-xs-6', [
        full_cost ? div('.row.no-gutter.clearfix', [
          full_cost
        ]) : null,
        full_stage_time ? div('.row.no-gutter.clearfix', [
          full_stage_time
        ]) : null,
        performer_sign_up ? div('.row.no-gutter.clearfix', [
          renderPerformerSignup(performer_sign_up)
        ]) : null,
        performer_limit ? div('.row.no-gutter.clearfix', [
          renderPerformerLimit(performer_limit)
        ]) : null,
        categories.length ? div('.row.no-gutter.clearfix', [
          renderTextList(categories)
        ]) : null,
        // event_types.length ? div('.row.no-gutter.clearfix', [
        //   renderTextList(event_types)
        // ]) : null
      ])
    ]),
    merged_cost_stage_time ? merged_cost_stage_time : null,
    renderNote(note),
    div(`.row.no-gutter.map-area`, [
      renderMarkerInfo(donde),
      div(`#listing-location-map`)
    ]),
    renderUpcomingEvents(children)
  ])
}


export function renderSingleListing(state) {
  const {listing} = state
  const {type, donde, cuando, meta} = listing
  const {
    name, event_types, categories, notes, 
    performer_cost, description, contact_info, 
    performer_sign_up, stage_time, 
    performer_limit, listed_hosts, note} = meta

  const [full_cost, full_stage_time, merged_cost_stage_time] = 
    getFullCostAndStageTime(performer_cost, stage_time)

  return div('.container-fluid.nav-fixed-offset.mt-xs', [
    div('.row.mb-1', [
      div('.col-xs-6', [
        div('.row.no-gutter', [
          renderNameWithParentLink(listing)
        ]),
        div('.row.no-gutter', [
          renderCuando(listing)
        ]),
        div('.row.no-gutter', [
          renderDonde(donde)
        ]),
        renderContactInfo(contact_info),
      ]),
      div('.col-xs-6', [
        div('.row.no-gutter.clearfix', [
          renderCuandoStatus(cuando)
        ]),
        full_cost ? div('.row.no-gutter.clearfix', [
          full_cost
        ]) : null,
        full_stage_time ? div('.row.no-gutter.clearfix', [
          full_stage_time
        ]) : null,
        performer_sign_up ? div('.row.no-gutter.clearfix', [
          renderPerformerSignup(performer_sign_up)
        ]) : null,
        performer_limit ? div('.row.no-gutter.clearfix', [
          renderPerformerLimit(performer_limit)
        ]) : null,
        categories.length ? div('.row.no-gutter.clearfix', [
          renderTextList(categories)
        ]) : null,
        // event_types.length ? div('.row.no-gutter.clearfix', [
        //   renderTextList(event_types)
        // ]) : null
        div('.row.no-gutter.clearfix', [
          renderButtons(state)
        ]),
      ])
    ]),
    merged_cost_stage_time ? merged_cost_stage_time : null,
    renderNote(note),
    div(`.row.no-gutter.map-area`, [
      renderMarkerInfo(donde),
      div(`#listing-location-map`)
    ])
  ])
}


function view(state$) {
  return state$
    .map(state => {
      const {geolocation, authorization, listing, checked_in, in_flight, settings} = state
      const {type, donde} = listing
      //console.log(donde)
      return type === "single" ? renderSingleListing(state) : renderRecurringListing(state)
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
          dragPan: false,
          scrollZoom: false
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

export default function main(sources, inputs) {
  const actions = intent(sources)
  const in_flight$ = createProxy()
  const state$ = model(actions, {...inputs, in_flight$, geolocation$: inputs.Geolocation.cachedGeolocation$})
  const vtree$ = view(state$)
  const mapjson$ = mapview(state$)

  const to_http$ = actions.checkin$.withLatestFrom(state$, (_, state) => {
    const {geolocation, listing} = state
    if (geolocation.type === `position`) {
      const lng_lat = geoToLngLat(geolocation)
      return {
        url: `/api/user`,
        method: `post`,
        send: {
          route: `/check_in`,
          data: {
            listing_id: listing.id,
            lng_lat
          }
        },
        category: `checkInToEvent`
      }
    } else {
      return null
    }
  }).filter(x => !!x)
    //.do(x => console.log(`checkin request`, x))
    .publishReplay(1).refCount()
  
  const to_router$ = O.merge(
    actions.to_parent$.withLatestFrom(state$, (_, state) => {
      const {listing} = state
      return {
        type: `push`,
        state: undefined,
        pathname: `/listing/${listing.parent_id}`
      } 
    })
  )

  in_flight$.attach(to_http$)

  return {
    DOM: vtree$,
    MapJSON: mapjson$,
    Router: to_router$,
    HTTP: to_http$
  }
}
