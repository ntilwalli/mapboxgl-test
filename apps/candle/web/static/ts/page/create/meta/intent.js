import {Observable as O} from 'rxjs'
import {getEmptyListing} from '../listing'
import {inflate} from '../listing'
export default function intent(sources) {
  const {Router} = sources
  const listing$ = Router.history$
    .map(route => route.state || getEmptyListing())
    .map(x => inflate(x))
    .publishReplay(1).refCount()
  return {
    listing$
  }
}
