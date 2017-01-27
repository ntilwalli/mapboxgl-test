import {Observable as O} from 'rxjs'
import {combineObj, componentify} from './utils'

import SearchApp from './component/search/oneDay/main'
//import ListingApp from './component/listing/main'
import ListingApp from './component/newListing/main'
import UserApp from './component/user/newMain'
import {main as CreateApp} from './component/create/main'
import {main as SettingsApp} from './component/settings/main'

const routes = [
  //{pattern: /^\/user/, value: UserApp},
  {pattern: /^\/settings/, value: {component: SettingsApp, auth: false}},
  {pattern: /^\/create/, value: {component: CreateApp, auth: true}},
  {pattern: /^\/listing/, value: {component: ListingApp, auth: false}},
  {pattern: /^\/[a-zA-Z][a-zA-Z0-9]*/, value: {component: UserApp, auth: false, key: 'user'}},
  {pattern: /.*/, value: {component: SearchApp, auth: false}}
]

const scrollTop = _ => {
  //console.log('scrolling top')
  setTimeout(() => window.scrollTo(0, 0), 50)
}

export default function routing(sources, inputs) {
  const {Router} = sources
  const routing$ = combineObj({
    route$: Router.define(routes),
    authorization$: inputs.Authorization.status$
  }).do(scrollTop)
    .map((info: any) => {
      const {route, authorization} = info
      const {component, auth, key} = route.value.info
      //const component = component.info
      if (!auth || auth && authorization) {
        return component({
          ...sources,
          Router: key === 'user' ? Router : Router.path(route.path)
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
