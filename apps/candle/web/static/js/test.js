import {Observable as O} from 'rxjs'
import Cycle from '@cycle/rxjs-run'
import {makeDOMDriver} from '@cycle/dom'

import component from './library/timeInput/main'
//import component from './library/dateInput/main'

function app(sources) {
  const out = component(
    sources, {
      props$: O.of({
        rangeStart: new Date()
      }), 
      rangeStart$: O.of(new Date()), 
      rangeEnd$: O.never()
    })
  out.result$.subscribe(x => console.log(x))
  return out
}

const {sinks, sources, run} = Cycle(app, {
  DOM: makeDOMDriver('#app-main')
})

run()
