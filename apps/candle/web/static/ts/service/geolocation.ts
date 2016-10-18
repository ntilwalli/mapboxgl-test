import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../utils'
import deepEqual = require('deep-equal')

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
    lngLat$: position$,
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

  const storageUserVicinity$ = sources.Storage.local.getItem(`userVicinity`)
    .map(x => {
      return x && JSON.parse(x)
    })
  const storageHomeVicinity$ = sources.Storage.local.getItem(`homeVicinity`)
      .map(x => x && JSON.parse(x))
  const storageOverrideVicinity$ = sources.Storage.local.getItem(`overrideVicinity`)
      .map(x => x && JSON.parse(x))

  return {
    position$,
    region$,
    error$,
    storageUserVicinity$,
    storageHomeVicinity$,
    storageOverrideVicinity$,
    HTTP: regionService.HTTP
  }
}

function reducers(actions, inputs) {
  const positionR = actions.position$
    .map(pos => state => state.update(`user`, x => ({
        region: x && x.region,
        position: pos,
        sync: false
      })
    ))

  const regionR = actions.region$
    .map(r => state => state.update(`user`, x => ({
        region: r,
        position: x && x.position,
        sync: true
      })
    ))

  // const positionR = actions.position$
  //   .map(pos => state => state.update(`user`, x => undefined))

  // const regionR = actions.region$
  //   .map(r => state => state.update(`user`, x => undefined))

  const errorR = actions.error$
    .map(err => state => {
      return state.set(`error`, err)
        .update(`user`, x => undefined)
    })

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
    user$: actions.storageUserVicinity$.take(1),
    home$: actions.storageHomeVicinity$.take(1),
    override$: actions.storageOverrideVicinity$.take(1)
  })
  .take(1)
  .switchMap(({user, home, override} : any) => {
    const initial = {
      prefer: override ? "override" : "user",
      user: user,//undefined, 
      home: home || {
        position: {lat: 40.7128, lng: -74.0059},
        region: {
          source: `manual`,
          type: `somewhere`,
          data: {
            country: `US`,
            locality: `New York`,
            region: `NY`
          }
        }
      },
      override,
      error: undefined
    }

    return reducer$.startWith(Immutable.Map(initial)).scan((acc, f: Function) => f(acc))
  })
  .map(x => (<any> x).toJS())
  .map(x => {
    return x
  })
  .publishReplay(1).refCount()

  const validUser$ = status$.map(x => x.user)
        .filter(x => !!x)
        .distinctUntilChanged(deepEqual)
        .map(x => ({
          action: `setItem`,
          key: `userVicinity`,
          value: JSON.stringify(x)
        }))

  const invalidUser$ = status$.map(x => x.user)
      .filter(x => !x)
      .distinctUntilChanged(deepEqual)
      .map(x => ({
        action: `removeItem`,
        key: `userVicinity`,
        value: JSON.stringify(x)
      }))

  const validHome$ = status$.map(x => x.home)
      .filter(x => !!x)
      .distinctUntilChanged(deepEqual)
      .map(x => ({
        action: `setItem`,
        key: `homeVicinity`,
        value: JSON.stringify(x)
      }))

  const validOverride$ = status$.map(x => x.override)
        .filter(x => !!x)
        .distinctUntilChanged(deepEqual)
        .map(x => ({
          action: `setItem`,
          key: `overrideVicinity`,
          value: JSON.stringify(x)
        }))

  const invalidOverride$ = status$.map(x => x.override)
      .filter(x => !x)
      .distinctUntilChanged(deepEqual)
      .map(x => ({
        action: `removeItem`,
        key: `overrideVicinity`,
        value: JSON.stringify(x)
      }))

  const toStorage$ = O.merge(
    validUser$, invalidUser$, validHome$, validOverride$, invalidOverride$
  )

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
