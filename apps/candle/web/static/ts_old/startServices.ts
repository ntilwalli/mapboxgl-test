import {Observable as O} from 'rxjs'

import Authorization from './service/authorization/main'
import GeoLocation from './service/geolocation'
import PassThrough from './service/passthrough'
// import Preferences from './service/preferences/main'

export default function main(sources, inputs) {
  const authorization = Authorization(sources, inputs)
  const authorization$ = authorization.status$
    .publishReplay(1).refCount()

  const geolocation = GeoLocation(sources, inputs)
  const geolocation$ = geolocation.status$
    .publishReplay(1).refCount()

  const passthrough = PassThrough(sources, inputs)

  const fromServicesMessage$ = O.merge(authorization.message$, passthrough.message$).publish().refCount()

  return {
    HTTP: O.merge(
      authorization.HTTP, 
      geolocation.HTTP
    ),
    Global: O.merge(
      authorization.Global, 
      geolocation.Global
    ),
    Storage: geolocation.Storage,
    outputs: {
      message$: fromServicesMessage$,
      authorization$,
      geolocation$
    }
  }
}
