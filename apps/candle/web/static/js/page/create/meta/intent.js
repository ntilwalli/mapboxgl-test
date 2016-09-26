import {Observable as O} from 'rxjs'
import {getEmptyListing} from '../listing'
export default function intent(sources) {
  const {Router} = sources
  const listing$ = Router.history$
    .map(route => route.state || getEmptyListing())
    .publishReplay(1).refCount()
  return {
    listing$
  }
}
