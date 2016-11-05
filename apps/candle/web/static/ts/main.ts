import {Observable as O} from 'rxjs'
import Cycle from '@cycle/rxjs-run';
import {makeDOMDriver, div} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import makeGlobalDriver from './globalDriver'
// import {makeRouterDriver} from 'cyclic-router';
import storageDriver from '@cycle/storage'
// import {createHistory} from 'history';
// import {makeMapJSONDriver} from 'cycle-mapboxgl'
// import isolate from '@cycle/isolate'
import {normalizeComponent, spread} from './utils'

import Preferences from  './component/preferences/main'
import OneDayCalendar from './component/calendar/oneDay/main'

function main(sources) {
  
  const preferences$ = Preferences(sources)
  const inputs = {preferences$}
  const oneDayCalendar = OneDayCalendar(sources, inputs)
  return oneDayCalendar

  // return normalizeComponent({
  //   DOM: O.of(div([`Hello`]))
  // })

}

Cycle.run(main, {
  DOM: makeDOMDriver(`#app-main`),
  HTTP: makeHTTPDriver(),
  Global: makeGlobalDriver(),
  Storage: storageDriver
})
