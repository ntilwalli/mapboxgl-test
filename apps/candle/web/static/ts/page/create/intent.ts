import {Observable as O} from 'rxjs'
import {RETRIEVE_LISTING_URL} from './constant'
import {getEmptyListing} from './listing'

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
        type: `success`,
        data: {
          id: 12345
        }
      })
    })
    .filter(x => {
      return x.type === `success`
    })
    .map(x => {
      const listing = getEmptyListing()
      listing.id = x.data.id
      return listing
    })
    //.do(x => console.log(`retrieved listing`, x))
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
    fromHTTP$,
    initialState$
  }
}
