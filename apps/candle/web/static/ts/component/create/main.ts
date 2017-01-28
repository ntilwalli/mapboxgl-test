import {Observable as O} from 'rxjs'
import {combineObj, mergeSinks, componentify, normalizeSink} from '../../utils'

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
      //console.log(`route`, route)
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
    .publishReplay(1).refCount()

  // const out = {
  //   DOM: normalizeSink(component$, `DOM`)
  //     .map(x => {
  //       return x
  //     })
  //     .publishReplay(1).refCount(),
  //   MapJSON: normalizeSink(component$, `MapJSON`)
  //     .map(x => {
  //       return x
  //     })
  //     .publishReplay(1).refCount(),
  //   Router: normalizeSink(component$, `Router`)
  //     .map(x => {
  //       return x
  //     })
  //     .publishReplay(1).refCount(),
  //   Global: normalizeSink(component$, `Global`)
  //     .map(x => {
  //       return x
  //     })
  //     .publishReplay(1).refCount(),
  //   Storage: normalizeSink(component$, `Storage`)
  //     .map(x => {
  //       return x
  //     })
  //     .publishReplay(1).refCount(),
  //   HTTP: normalizeSink(component$, `HTTP`)
  //     .map(x => {
  //       return x
  //     })
  //     .publishReplay(1).refCount(),
  //   Phoenix: normalizeSink(component$, 'Phoenix')
  //     .map(x => {
  //       return x
  //     })
  //     .publishReplay(1).refCount(),
  //   //Heartbeat: normalizeSink(component$, `Heartbeat`).publish().refCount(),
  //   MessageBus: normalizeSink(component$, `MessageBus`)
  //     .map(x => {
  //       return x
  //     })
  //     .publishReplay(1).refCount(),
  // }




  const out = componentify(component$)
  //out.HTTP.subscribe(x => console.log(`HTTP routing:`, x))

  //const to_http$ = out.HTTP.publish().refCount()
  // to_http$.subscribe(x => {
  //   console.log('to_http', x)
  // })

  return out
  // return {
  //   ...out,
  //   HTTP: to_http$
  // }
}

export {
  main
}