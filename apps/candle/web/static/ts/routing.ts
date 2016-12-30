import {Observable as O} from 'rxjs'
import {combineObj, componentify} from './utils'

import SearchApp from './component/search/oneDay/main'
import ListingApp from './component/listing/main'
import HomeApp from './component/newHome/main'
import {main as CreateApp} from './component/create/main'
import {main as SettingsApp} from './component/settings/main'

const routes = [
  //{pattern: /^\/user/, value: UserApp},
  {pattern: /^\/settings/, value: {component: SettingsApp, auth: false}},
  {pattern: /^\/create/, value: {component: CreateApp, auth: true}},
  {pattern: /^\/home/, value: {component: HomeApp, auth: false}},
  {pattern: /^\/listing/, value: {component: ListingApp, auth: false}},
  {pattern: /.*/, value: {component: SearchApp, auth: false}}
]

const scrollTop = _ => {
  //console.log('scrolling top')
  window.scrollTo(0, 0)
}


export default function routing(sources, inputs) {
  const {Router} = sources
  const routing$ = combineObj({
    route$: Router.define(routes),
    authorization$: inputs.Authorization.status$
  }).do(scrollTop)
    .map((info: any) => {
      const {route, authorization} = info
      const {component, auth} = route.value.info
      //const component = component.info
      if (!auth || auth && authorization) {
        return component({
          ...sources,
          Router: Router.path(route.path)
        }, inputs)
      } else {
        return {
          Router: O.of({
            pathname: `/`,
            type: 'replace',
            action: `REPLACE`,
            state: {
              errors: [
                `Must be logged-in to create new listing`
              ]
            }
          })
          //.do(x => console.log(`Not authorized, redirecting to /...`))
          .delay(4)
        }
      }
    })
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const out = componentify(routing$)
  //out.HTTP.subscribe(x => console.log(`HTTP routing:`, x))
  return out
}
