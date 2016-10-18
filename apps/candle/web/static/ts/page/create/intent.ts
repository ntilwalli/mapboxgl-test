import {Observable as O} from 'rxjs'
import {RETRIEVE_LISTING_URL} from './constant'
import {getEmptySession} from './listing'

export default function intent(sources) {
  const {HTTP, Storage} = sources
  const fromHTTP$ = HTTP.select(`retrieveListing`)
    //.filter(x => x.request.url === RETRIEVE_LISTING_URL)
    .switchMap(x => x)
    .filter(x => x.status === 200)
    .map(x => {
      return x.body
    })
    .catch((err, orig$) => {
      return O.of({
        type: `ugly`,
        data: err
      })
    })
    .publish().refCount()

  const good$ = fromHTTP$
    .filter(x => {
      return x.type === `success`
    })
    .map(x => {
      return x.data
    })
    .publishReplay(1).refCount()

  const bad$ = fromHTTP$
    .filter(x => {
      return x.type === `error`
    })
    .map(x => {
      return x.data
    })
    .publishReplay(1).refCount()

  const ugly$ = fromHTTP$
    .filter(x => {
      return x.type === `ugly`
    })
    .map(x => {
      return x.data
    })
    .publishReplay(1).refCount()

  const storedState$ = Storage.local.getItem(`createListing`)
  const initialState$ = storedState$
    .map(x => {
      return x || {
        waiting: false,
        errors: []
      }
    }).take(1)

  return {
    fromHTTP$: good$,
    bad$,
    ugly$,
    initialState$
  }
}
