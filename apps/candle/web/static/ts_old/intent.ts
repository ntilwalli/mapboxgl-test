import {Observable as O} from 'rxjs'
import queryString = require('query-string')

export default function intent(sources) {
  const {Global, Router} = sources
  const urlParams$ = Router.history$
    .map(x => queryString.parse(x.search))
    .map(x => x.modal)
    .publishReplay(1).refCount()

  //const resize$ = sources.DOM.select(`body`).events(`resize`).subscribe(ev => console.log(ev))

  //urlParams$.subscribe()
  return {
    thresholdUp$: Global.filter(x => x.type === `thresholdUp`),
    modal$: urlParams$.map(x => {
      return (x === `login` || x === `signup` || x === `presignup` || x === `vicinity`) ? x : null
    }).publishReplay(1).refCount()
  }
}