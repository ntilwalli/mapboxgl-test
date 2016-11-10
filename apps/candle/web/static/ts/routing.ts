import {Observable as O} from 'rxjs'
import {combineObj, componentify, spread} from './utils'

import OneDayCalendar from './component/calendar/oneDay/main'
import Listing from './component/listing/main'
//import CreateListing from './createListing/main'

const routes = [
  {pattern: /^\/listing/, value: Listing},
  {pattern: /.*/, value: OneDayCalendar}
]

export default function routing(sources, inputs) {
  const {Router} = sources
  const routing$ = Router.define(routes)
    .map(route => {
      const data = route.value
      const component = data.info
      return component(spread(
        sources, {
        Router: Router.path(route.path)
      }), inputs)
    })
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  return componentify(routing$)
}
