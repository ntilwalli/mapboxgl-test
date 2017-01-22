import {Observable as O} from 'rxjs'
import {combineObj, mergeSinks, componentify} from '../../utils'

import {main as ListingApp} from './newListing/main'
// import {main as Landing} from './landing'
// import {main as routing} from './routing'

const routes = [
  //{pattern: /^\/user/, value: UserApp},
  {pattern: /^\/listing/, value: {type: 'success', component: ListingApp}},
  {pattern: /.*/, value: {type: 'error'}}
]

function main(sources, inputs) {

  const {Router} = sources
  const routing$ = Router.define(routes)
    .map(route => {
      //console.log(`route`, route)
      const data = route.value
      const {type, component} = data.info
      if (type === 'success' && route.location.state) {
        return component({
          ...sources,
          Router: Router.path(route.path)
        }, inputs)
      } 
      else {
        return {
          Router: O.of({
            pathname: `/create/listing`,
            type: `replace`,
            state: {
              type: `new`
            }
          }).delay(1)
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

export {
  main
}