import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../utils'
import moment = require('moment')

const log = console.log.bind(console)
const onlyUserLocation = preferences => preferences.useLocation === `user`
const onlyHomeLocation = preferences => preferences.useLocation === `home`
const onlyOverrideLocation = preferences => preferences.useLocation === `override`

const geoToLngLat = x => {
  const {latitude, longitude} = x.data.coords
  return {lng: longitude, lat: latitude}
}

function reducers(actions, inputs) {
  const retrieveR = inputs.retrieve$.map(_ => state => {
    return state.set(`retrieving`, true)
  })

  const resultsR = actions.results$.map(results => state => {
    //console.log(`Received new search results...`)
    return state.set(`results`, results).set(`retrieving`, false)
  })

  const userPositionR = inputs.preferences$
    .filter(onlyUserLocation)
    .switchMap(preferences => {
      return actions.geolocation$.take(1).map(geolocation => ({preferences, geolocation}))
    })
    //.do(x => console.log(`userPositionR:`, x))
    .map(({preferences, geolocation}) => state => {
      if (geolocation.type === "position") {
        return state.set(`searchPosition`, {type: "user", data: geoToLngLat(geolocation)})
      } else {
        return state.set(`searchPosition`, {type: "user_location_not_available_using_home", data: preferences.homeLocation.position})
      }
    })

  // const userPositionR = actions.geolocation$.map(x => state => state.set(`searchPosition`, {type: "user", data: geoToLngLat(x)}))

  const homePositionR = inputs.preferences$
    .filter(onlyHomeLocation)
    .map(preferences => state => {
      return state.searchPosition = {type: "home", data: preferences.homeLocation.position}
    })

  const overridePositionR = inputs.preferences$
    .filter(onlyOverrideLocation)
    .map(preferences => state => {
      return state.searchPosition = {type: "override", data: preferences.overrideLocation.position}
    })

  return O.merge(retrieveR, resultsR, userPositionR, homePositionR, overridePositionR)
}

function getInitialSearchPosition(preferences) {
  const {useLocation, homeLocation, overrideLocation} = preferences
  if (useLocation === "override" && overrideLocation) {
    return {type: "override", data: overrideLocation.position}
  } else if (useLocation === "user") {
    return undefined
  } else {
    return {type: "home", data: homeLocation.position}
  }
}

const useCached = cached => {
  if (cached) {
    const todayStart = moment().startOf('day')
    const cachedStart = cached.searchDateTime.startOf('day')
    return (cached && todayStart.isSame(cachedStart)) ? true : false
  }

  return false
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const searchDateTime = moment()
  return combineObj({
      preferences$: inputs.preferences$.take(1),
      cached$: actions.cached$.take(1)
    })
    .switchMap((info: any) => {
      const {preferences, cached} = info
      //console.log(`Use cached: `, useCached(cached))
      return reducer$
        .startWith(Immutable.Map({
          results: useCached(cached) ? cached.results : undefined,
          searchDateTime: moment(),
          searchPosition: getInitialSearchPosition(preferences),
          retrieving: false
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`model state:`, x))
    .publishReplay(1).refCount()
}