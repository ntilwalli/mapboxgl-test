import {Observable as O} from 'rxjs'
import {combineObj, componentify} from './utils'

import SearchApp from './component/search/oneDay/main'
import ListingApp from './component/listing/main'
import HomeApp from './component/home/main'
import {main as CreateApp} from './component/create/main'
import {main as SettingsApp} from './component/settings/main'

const routes = [
  //{pattern: /^\/user/, value: UserApp},
  {pattern: /^\/settings/, value: SettingsApp},
  {pattern: /^\/create/, value: CreateApp},
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
      return component({
        ...sources,
        Router: Router.path(route.path)
      }, inputs)
    })
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const out = componentify(routing$)
  //out.HTTP.subscribe(x => console.log(`HTTP routing:`, x))
  return out
}
