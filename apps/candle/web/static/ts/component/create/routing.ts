import {Observable as O} from 'rxjs'
import {combineObj, componentify} from '../../utils'

import {main as ListingApp} from './listing/main'
import {main as Landing} from './landing'

const routes = [
  //{pattern: /^\/user/, value: UserApp},
  {pattern: /^\/listing/, value: ListingApp},
  {pattern: /.*/, value: Landing}
]

function main(sources, inputs) {
  const {Router} = sources
  const routing$ = Router.define(routes)
    .map(route => {
      //console.log(`route`, route)
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

export {
  main
}