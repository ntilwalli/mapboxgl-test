import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeSink, spread, createProxy} from '../utils'

function main(sources) {
  return {
    output$: O.of({
      useLocation: `user`,
      homeLocation: {
        position: {
          lng: -74.0059,
          lat: 40.7128
        }
      },
      overrideLocation: undefined
    }).publishReplay(1).refCount()
  }
}

export default main
