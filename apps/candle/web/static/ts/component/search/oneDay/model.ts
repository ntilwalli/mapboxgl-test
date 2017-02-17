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
  const retrieve_r = inputs.waiting$.map(_ => state => {
    //console.log(`Retrieval status updated...`)
    return state.set(`retrieving`, true)
  })

  const results_r = inputs.results$.map(results => state => {
    //console.log(`Search results updated...`)
    return state.set(`results`, Immutable.fromJS(results)).set(`retrieving`, false)
  })

  const user_position_r = inputs.settings$
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

  const default_position_r = inputs.settings$
    .filter(onlyDefaultRegion)
    .map(settings => state => {
      return state.set(`searchPosition`, Immutable.fromJS({type: "default", data: settings.default_region.position}))
    })

  return O.merge(
    retrieve_r, results_r, user_position_r, 
    default_position_r
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
      authorization$: inputs.Authorization.status$.take(1),
      filters$: inputs.search_filters$.take(1)
    })
    .switchMap((info: any) => {
      const {props, settings, cached, authorization} = info

      let searchDateTime
      if (props && props.searchDateTime) {
        searchDateTime = moment(new Date(props.searchDateTime))
      } else {
        searchDateTime = moment()
      }

      return reducer$
        .startWith(Immutable.fromJS({
          results: useCached(searchDateTime, cached) ? cached.results : undefined,
          searchDateTime,
          searchPosition: getInitialSearchPosition(settings),
          retrieving: false,
          modal: (props && props.modal),
          filters: info.filters,
          authorization
        }))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .debounceTime(0)
    //.do(x => console.log(`oneDay state:`, x))
    .publishReplay(1).refCount()
}