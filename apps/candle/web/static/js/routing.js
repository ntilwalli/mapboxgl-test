import {Observable as O} from 'rxjs'
import {combineObj, normalizeComponentStream, spread} from './utils'

import BasicFakeComponent from './fake/basic/main'
import WithMapFakeComponent from './fake/withMap/main'
import WithLoginFakeComponent from './fake/withLogin/main'
import WithSignupFakeComponent from './fake/withSignup/main'
import WithPresignupFakeComponent from './fake/withPresignup/main'
import Home from './page/home/main'
import Restricted from './restricted'
import CreateListing from './page/create/main'
//import CreateListing from './createListing/main'

const routes = [
  {pattern: /\/create/, value: CreateListing},
	{pattern: /\/restricted/, value: Restricted},
  {pattern: /.*/, value: Home}
]

// const routes = {
//   //'/': WithPresignupFakeComponent,
//   '/create':  CreateListing,
// 	'/restricted': Restricted,
//   '*':  Home
// }

export default function routing(sources, inputs) {
  const {Router} = sources
  const routing$ = Router.define(routes)
    .map(x => {
      return x
    })
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

  return normalizeComponentStream(routing$)
}
