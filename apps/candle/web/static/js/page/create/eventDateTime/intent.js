import {Observable as O} from 'rxjs'

export default function intent(sources) {
  const {Router} = sources

  const listing$ = Router.history$.map(x => x.state).publishReplay(1).refCount()

  return {
    listing$
  }
}
