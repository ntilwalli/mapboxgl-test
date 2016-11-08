import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, geoToLngLat} from '../../../utils'
import {getDefaultFilters} from './helpers'
import moment = require('moment')

const log = console.log.bind(console)
const onlyUserLocation = preferences => preferences.useLocation === `user`
const onlyHomeLocation = preferences => preferences.useLocation === `home`
const onlyOverrideLocation = preferences => preferences.useLocation === `override`

function reducers(actions, inputs) {
  const retrieveR = inputs.retrieve$.map(_ => state => {
    //console.log(`Retrieval status updated...`)
    return state.set(`retrieving`, true)
  })

  const resultsR = actions.results$.map(results => state => {
    //console.log(`Search results updated...`)
    return state.set(`results`, results).set(`retrieving`, false)
  })

  const userPositionR = inputs.preferences$
    .filter(onlyUserLocation)
    .switchMap(preferences => {
      return inputs.Geolocation.cachedGeolocation$.map(geolocation => ({preferences, geolocation}))
    })
    .map(({preferences, geolocation}) => state => {
      //console.log(`userPosition updated...`)
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
      //console.log(`homePosition updated...`)
      return state.searchPosition = {type: "home", data: preferences.homeLocation.position}
    })

  const overridePositionR = inputs.preferences$
    .filter(onlyOverrideLocation)
    .map(preferences => state => {
      //console.log(`overridePosition updated...`)
      return state.searchPosition = {type: "override", data: preferences.overrideLocation.position}
    })

  const changeDateR = actions.changeDate$
    .map(val => state => {
      //console.log(`changeDate...`)
      return state.update(`searchDateTime`, x => {
        return x.clone().add(val, 'days')
      }).set(`results`, [])
    })
  
  const showFiltersR = actions.showFilters$.map(_ => state => {
    //console.log(`show filters...`)
    return state.set(`showFilters`, true)
  })

  const hideFiltersR = inputs.hideFilters$.map(_ => state => {
    return state.set(`showFilters`, false)
  })

  const updateFiltersR = inputs.updateFilters$.map(val => state => {
    //console.log(`update filters:`, val)
    return state.set(`showFilters`, false).set(`filters`, val)
  })

  return O.merge(
    retrieveR, resultsR, userPositionR, 
    homePositionR, overridePositionR,
    changeDateR, showFiltersR, hideFiltersR,
    updateFiltersR
  )
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
      cached$: actions.cached$.take(1),
      authorization$: inputs.Authorization.status$.take(1)
    })
    .switchMap((info: any) => {
      const {preferences, cached, authorization} = info
      //console.log(`Cached:`, cached)
      return reducer$
        .startWith(Immutable.Map({
          results: useCached(cached) ? cached.results : undefined,
          searchDateTime: moment(),
          searchPosition: getInitialSearchPosition(preferences),
          retrieving: false,
          showFilters: false,
          filters: (cached && cached.filters) || getDefaultFilters(),
          authorization
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`model state:`, x))
    .publishReplay(1).refCount()
}