import {Observable as O} from 'rxjs'
import {getEmptySession} from '../listing'
import {inflate} from '../listing'
export default function intent(sources) {
  const {Router} = sources
  const session$ = Router.history$
    .map(route => route.state || getEmptySession())
    .map(x => {
      return inflate(x)
    })
    .publishReplay(1).refCount()

  return {
    session$
  }
}
