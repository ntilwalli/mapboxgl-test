import {Observable as O} from 'rxjs'
import {combineObj, componentify, spread} from './utils'

import SearchApp from './component/search/oneDay/main'
import ListingApp from './component/listing/main'
import HomeApp from './component/home/main'
import {main as CreateListing} from './component/create/main'

const routes = [
  //{pattern: /^\/user/, value: UserApp},
  {pattern: /^\/create/, value: CreateListing},
  {pattern: /^\/home/, value: HomeApp},
  {pattern: /^\/listing/, value: ListingApp},
  {pattern: /.*/, value: SearchApp}
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
