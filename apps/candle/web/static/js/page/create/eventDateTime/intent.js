import {Observable as O} from 'rxjs'

export default function intent(sources, inputs) {
  const {Router} = sources

  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .map(listing => {
      return inflate(listing)
    })
    .publishReplay(1).refCount()

  return {
    listing$
  }
}
