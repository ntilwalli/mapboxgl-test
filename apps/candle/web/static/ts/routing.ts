import {Observable as O} from 'rxjs'
import {combineObj, componentify, traceStartStop} from './utils'

import SearchApp from './component/search/oneDay/main'
//import ListingApp from './component/listing/main'
import ListingApp from './component/newListing/main'
import UserApp from './component/newUser/main'
import ForgottenPasswordApp from './component/forgottenPassword/main'
import {main as CreateApp} from './component/create/main'
import {main as SettingsApp} from './component/settings/main'
import {main as PrivacyApp} from './component/privacy/main'

function RedirectApp() {
  return {
    Router: O.of({
      type: 'replace',
      pathname: '/'
    }).delay(10)
  }
}

const routes = [
  //{pattern: /^\/user/, value: UserApp},
  {pattern: /^\/i\/forgotten/, value: {component: ForgottenPasswordApp, auth: false}},
  {pattern: /^\/settings/, value: {component: SettingsApp, auth: false}},
  {pattern: /^\/create/, value: {component: CreateApp, auth: false }},
  {pattern: /^\/listing/, value: {component: ListingApp, auth: false}},
  {pattern: /^\/privacy/, value: {component: PrivacyApp, auth: false}},
  {pattern: /^\/[a-zA-Z][a-zA-Z0-9]{4,}/, value: {component: UserApp, auth: false, key: 'user'}},
  {pattern: /^\/$/, value: {component: SearchApp, auth: false}},
  {pattern: /.*/, value: {component: RedirectApp, auth: false}}
]

const scrollTop = _ => {
  //console.log('scrolling top')
  //setTimeout(() => window.scrollTo(0, 0), 50)
}

export default function routing(sources, inputs) {
  const {Router} = sources
  const component$ = combineObj({
    route$: Router.define(routes),
    authorization$: inputs.Authorization.status$
  }).do(scrollTop)
    .map((info: any) => {
      //console.log('main/routing function', info)
      const {route, authorization} = info
      const {component, auth, key} = route.value.info
      //const component = component.info
      if (!auth || auth && authorization) {
        return component({
          ...sources,
          Router: key === 'user' ? Router : Router.path(route.path)
        }, inputs)
      } 
    })
    .map(x => {
      return x
    })
    //.letBind(traceStartStop('trace routing/component$'))
    .publishReplay(1).refCount()

  const out = componentify(component$)

  return out
}
