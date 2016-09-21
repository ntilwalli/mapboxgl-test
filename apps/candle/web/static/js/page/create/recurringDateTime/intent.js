import {Observable as O} from 'rxjs'

export default function intent(sources, inputs) {
  const {Router} = sources

  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .map(listing => {
      const time = listing.profile.time
      if (time) {
        let {start, end} = time
        start = start && typeof start === `string` ? new Date(start) : start
        end = end && typeof end === `string` ? new Date(end) : end
        listing.profile.time.start = start
        listing.profile.time.end = end
      }

      return listing
    })
    .publishReplay(1).refCount()

  return {
    listing$
  }
}
