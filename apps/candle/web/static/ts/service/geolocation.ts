import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../utils'
import {geoToLngLat} from '../mapUtils'
import deepEqual = require('deep-equal')

import FactualGeotagService from '../thirdParty/FactualGeotagService'

// Taken from: http://stackoverflow.com/questions/11042212/ff-13-ie-9-json-stringify-geolocation-object
function cloneAsObject(obj) {
    if (obj === null || !(obj instanceof Object)) {
        return obj;
    }
    var temp = (obj instanceof Array) ? [] : {};
    // ReSharper disable once MissingHasOwnPropertyInForeach
    for (var key in obj) {
        temp[key] = cloneAsObject(obj[key]);
    }
    return temp;
}

export default function main(sources) {
  const {Global, Storage} = sources
  const geolocation$ = Global.geolocation$
    .map(cloneAsObject)
    .publishReplay(1).refCount()
  
  const geoPosition$ = geolocation$
    .filter(x => x.type === `position`)
    .publishReplay(1).refCount()

  const geoError$ = geolocation$
    .filter(x => x.type === `error`)
    .publishReplay(1).refCount()

  const geotag$ = geoPosition$.map(geolocation => {
    const geotagService = FactualGeotagService({
      props$: O.of({category: `fromGeolocation`}),
      lngLat$: O.of(geoToLngLat(geolocation)),
      HTTP: sources.HTTP
    })

    return {
      HTTP: geotagService.HTTP,
      output$: geotagService.result$.map(geotag => ({geolocation, geotag}))
    }
  })
  //.do(x => console.log(`geotag$:`, x))
  .publishReplay(1).refCount()

  const geolocationWithGeotag$ = O.merge(
    geotag$.switchMap(x => x.output$),
    geoError$.map(geolocation => ({geolocation, geotag: undefined}))
  )
  //.do(x => console.log(`geolocationWithGeotag:`, x))
  .publishReplay(1).refCount()

  const toStorageGeolocation$ = geolocation$
    //.do(x => console.log(`geolocation:`, x))
    .map(x => ({
        action: `setItem`,
        key: `userGeolocation`,
        value: JSON.stringify(x)
      }))
    //.do(x => console.log(`geolocation to storage`, x))
    .publishReplay(1).refCount()

  const toStorageGeolocationWithGeotag$ = geolocationWithGeotag$
    //.do(x => console.log(`geolocationWithGeotag:`, x))
    .map(x => ({
        action: `setItem`,
        key: `userGeolocationWithGeotag`,
        value: JSON.stringify(x)
      }))
    //.do(x => console.log(`geolocation with geotag to storage`, x))
    .publishReplay(1).refCount()

  const storageGeolocation$ = sources.Storage.local.getItem(`userGeolocation`)
    .take(1)
    .filter(x => !!x)
    .map(x => {
      return x && JSON.parse(x)
    })
    .publishReplay(1).refCount()

  const storageGeolocationWithGeotag$ = sources.Storage.local.getItem(`userGeolocationWithGeotag`)
    .take(1)
    .filter(x => !!x)
    .map(x => {
      return x && JSON.parse(x)
    })
    .publishReplay(1).refCount()

  const cachedGeolocation$ = O.merge(
    geolocation$,
    storageGeolocation$
  ).publishReplay(1).refCount()

  const cachedGeolocationWithGeotag$ = O.merge(
    geolocationWithGeotag$,
    storageGeolocationWithGeotag$
  ).publishReplay(1).refCount()

  return {
    HTTP: geotag$.switchMap(x => x.HTTP),
    Storage: O.merge(
      toStorageGeolocation$,
      toStorageGeolocationWithGeotag$
    ),
    output: {
      geolocation$,
      geolocationWithGeotag$,
      cachedGeolocation$,
      cachedGeolocationWithGeotag$
    }
  }
}
