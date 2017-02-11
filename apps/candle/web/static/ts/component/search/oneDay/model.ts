import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../utils'
import {geoToLngLat} from '../../../mapUtils'
import {getDefaultFilters} from './helpers'
import moment = require('moment')

const log = console.log.bind(console)
const onlyUserRegion = settings => settings.use_region === `user`
const onlyDefaultRegion = settings => settings.use_region === `default`

function reducers(actions, inputs) {
  const retrieveR = inputs.waiting$.map(_ => state => {
    //console.log(`Retrieval status updated...`)
    return state.set(`retrieving`, true)
  })

  const resultsR = inputs.results$.map(results => state => {
    //console.log(`Search results updated...`)
    return state.set(`results`, Immutable.fromJS(results)).set(`retrieving`, false)
  })

  const userPositionR = inputs.settings$
    //.do(x => console.log(`settings`, x))
    .filter(onlyUserRegion)
    .switchMap(settings => {
      return inputs.Geolocation.cachedGeolocation$.map(geolocation => ({settings, geolocation}))
    })
    .map(({settings, geolocation}) => state => {
      if (geolocation.type === "position") {
        return state.set(`searchPosition`, Immutable.fromJS({type: "user", data: geoToLngLat(geolocation)}))
      } else {
        return state.set(`searchPosition`, Immutable.fromJS({type: "user_location_not_available_using_default", data: settings.default_region.position}))
      }
    })

  const defaultPositionR = inputs.settings$
    .filter(onlyDefaultRegion)
    .map(settings => state => {
      return state.set(`searchPosition`, Immutable.fromJS({type: "default", data: settings.default_region.position}))
    })

  const showFiltersR = inputs.show_filters$.map(_ => state => {
    //console.log(`show filters...`)
    return state.set(`showFilters`, true)
  })

  const hideFiltersR = inputs.hide_filters$.map(_ => state => {
    return state.set(`showFilters`, false)
  })

  const updateFiltersR = inputs.update_filters$.map(val => state => {
    //console.log(`update filters:`, val)
    return state.set(`showFilters`, false).set(`filters`, val)
  })

  return O.merge(
    retrieveR, resultsR, userPositionR, 
    defaultPositionR,
    showFiltersR, hideFiltersR,
    updateFiltersR
  )
}

function getInitialSearchPosition(settings) {
  //console.log(settings)
  const {use_region, default_region} = settings
  if (use_region === "default") {
    return {type: "default", data: default_region.position}
  } else if (use_region === "user") {
    return undefined
  } else {
    return {type: "default", data: default_region.position}
  }
}

const useCached = (sdt, cached) => {
  if (cached) {
    const currStart = sdt.startOf('day')
    const cachedStart = cached.searchDateTime.startOf('day')
    return (cached && currStart.isSame(cachedStart)) ? true : false
  }

  return false
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      props$: inputs.props$.take(1),
      settings$: inputs.settings$.take(1),
      cached$: actions.cached$.take(1),
      authorization$: inputs.Authorization.status$.take(1)
    })
    .switchMap((info: any) => {
      const {props, settings, cached, authorization} = info
      //console.log(``)
      //console.log(`Resetting oneDay state...`)
      let searchDateTime
      //console.log(props)
      if (props && props.searchDateTime) {
        //console.log(`searchDateTime from props`, props)
        searchDateTime = moment(new Date(props.searchDateTime))
      } else {
        //console.log(`searchDateTime from now`, moment())
        searchDateTime = moment()
      }

      return reducer$
        .startWith(Immutable.fromJS({
          results: useCached(searchDateTime, cached) ? cached.results : undefined,
          searchDateTime,
          searchPosition: getInitialSearchPosition(settings),
          retrieving: false,
          showFilters: false,
          filters: (cached && cached.filters) || getDefaultFilters(),
          authorization
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .debounceTime(0)
    //.do(x => console.log(`oneDay state:`, x))
    .publishReplay(1).refCount()
}