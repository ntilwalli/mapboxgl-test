import {Observable as O} from 'rxjs'
import {combineObj, mergeSinks, componentify, normalizeSink, traceStartStop} from '../../utils'

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
  const component$ = Router.define(routes)
    .map(route => {
      console.log('Component route emission:', route)
      const data = route.value
      const {type, component} = data.info
      if (type === 'success') {
        return component({
          ...sources,
          Router: Router.path(route.path)
        }, inputs)
      } 
      else {
        return {
          Router: O.of({
            pathname: `/create/listing`,
            type: `replace`
          }).delay(1)
        }
      }
    })
    .map(x => {
      return x
    })
    .letBind(traceStartStop('trace create/component$'))
    .publishReplay(1).refCount()



  const out = componentify(component$)

  return out
}

export {
  main
}