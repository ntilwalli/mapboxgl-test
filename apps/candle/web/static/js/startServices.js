import {Observable as O} from 'rxjs'

import Authorization from './service/authorization/main'
import GeoLocation from './service/geolocation'
import PassThrough from './service/passthrough'
// import Preferences from './service/preferences/main'

export default function main(sources, inputs) {
  const authorization = Authorization(sources, inputs)
  const authorization$ = authorization.status$
    .cache(1)

  const geolocation = GeoLocation(sources, inputs)
  const geolocation$ = geolocation.status$
    .cache(1)

  const passthrough = PassThrough(sources, inputs)

  const fromServicesMessage$ = O.merge(authorization.message$, passthrough.message$).share()

  return {
    HTTP: O.merge(authorization.HTTP, geolocation.HTTP),
    Global: O.merge(authorization.Global, geolocation.Global),
    Storage: geolocation.Storage,
    outputs: {
      message$: fromServicesMessage$,
      authorization$,
      geolocation$
    }
  }
}
