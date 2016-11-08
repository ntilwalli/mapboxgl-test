import {Observable as O} from 'rxjs'
import queryString = require('query-string')

function intent(sources) {
  const {Router} = sources

  const urlParams$ = Router.history$
    //.do(x => console.log(`history$`, x))
    .map(x => queryString.parse(x.search))
    .publishReplay(1).refCount()

  return {
    urlParams$,
    modal$: urlParams$.map(x => x.modal).map(x => {
      return (x === `login` || x === `signup` || x === `presignup` || x === `vicinity`) ? x : null
    }).publishReplay(1).refCount()
  }
}

export default intent