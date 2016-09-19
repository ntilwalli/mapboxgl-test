import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import {combineObj} from '../utils'

import FactualGeotagService from '../thirdParty/FactualGeotagService'

const GEOLOCATION_INDICATOR = `geolocation`

function toStorage(status) {
  return status
}

function intent(sources) {

  const geolocation$ = sources.Global
    .filter(x => x.type === GEOLOCATION_INDICATOR)
    .map(x => x.data)
    //.do(x => console.log(`Got new geolocation...`, x))
    .publish().refCount()

  const position$ = geolocation$
    .filter(x => x.type === `position`)
    .map(x => {
      const c = x.data.coords
      return {lat: c.latitude, lng: c.longitude}
    })
    // .map(x => {
    //   console.log(`latest geolocation: `, x)
    //   return x
    // })
    .publish().refCount()

  const error$ = geolocation$
    .filter(x => x.type === `error`)
    .map(x => {
      console.warn(`geolocation unavailable: `, x.data)
      return null
    })

  const regionService = FactualGeotagService({
    props$: O.of({category: `region from main`}),
    latLng$: position$,
    HTTP: sources.HTTP
  })

  const region$ = regionService.result$
    // .startWith(`start`)
    // .do(x => {
    //   if (x === `start`) {
    //     console.log(`starting region$`)
    //   }
    // })
    // .filter(x => x !== `start`)
    // .finally(() => {
    //   console.log(`ending region$`)
    // })
    .publish().refCount()

  const storagePosition$ = sources.Storage.local.getItem(`position`)
  const storageRegion$ = sources.Storage.local.getItem(`region`)
  const overrideRegion$ = sources.Storage.local.getItem(`overrideRegion`)

  return {
    position$,
    error$,
    storagePosition$,
    storageRegion$,
    overrideRegion$,
    region$,
    HTTP: regionService.HTTP
  }
}

function reducers(actions, inputs) {
  const positionR = actions.position$.map(pos => state => state.set(`position`, pos).set(`isRegionSynced`, false))
  const errorR = actions.error$.map(err => state => state.set(`error`, err).set(`position`, null).set(`region`, null))
  const regionR = actions.region$.map(r => state => state.set(`region`, r).set(`isRegionSynced`, true))

  return O.merge(
    positionR,
    errorR,
    regionR
  )
}

export default function GeoLocation(sources, inputs) {

  const actions = intent(sources)
  const reducer$ = reducers(actions, inputs)

  const status$ = combineObj({
    position$: actions.storagePosition$,
    region$: actions.storageRegion$,
    overrideRegion$: actions.overrideRegion$
  })
  .take(1)
  .switchMap(({position, region, overrideRegion}) => {
    const initial = {
      position: position && Object.keys(position).length ? JSON.parse(position) : undefined,
      region: region && Object.keys(position).length ? JSON.parse(region) : undefined,
      isRegionSynced: undefined,
      overrideRegion: overrideRegion && Object.keys(position).length ? JSON.parse(overrideRegion) : undefined,
      error: undefined
    }
    return reducer$.startWith(Immutable.Map(initial)).scan((acc, f) => f(acc))
  })
  .map(x => x.toJS())
  .map(x => {
    return x
  })
  .publishReplay(1).refCount()

  const toStorage$ = O.merge(
    actions.position$.map(x => ({
      action: `setItem`,
      key: `position`,
      value: JSON.stringify(x)
    })),
    actions.region$.map(x => ({
      action: `setItem`,
      key: `region`,
      value: JSON.stringify(x)
    }))
  )
  .map(x => {
    return x
  })

  const geoMessage$ = inputs.message$
    .filter(x => x.type === GEOLOCATION_INDICATOR)
    .map(x => x.data)
    .publish().refCount()

  const changeGeoProperties$ = geoMessage$
    .filter(x => x.type === `change`)
    .map(x => x.data)

  return {
    status$,
    Global: changeGeoProperties$
      .map(x => ({
        type: `geolocation`,
        data: x
      })),
    Storage: toStorage$,
    HTTP: actions.HTTP
  }
}
