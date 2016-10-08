import {Observable as O} from 'rxjs'
import {inflate} from '../listing'
export default function intent(sources) {

  const {Router, DOM} = sources
  const listing$ = Router.history$.take(1)
    .map(route => {
      return inflate(route.state)
    })
    .publishReplay(1).refCount()

  return {
    listing$
  }
}
