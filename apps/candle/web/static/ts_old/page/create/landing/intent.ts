import {Observable as O} from 'rxjs'

export default function intent(sources) {

  const {Router, DOM} = sources
  const listing$ = Router.history$.take(1)
    .map(route => {
      return route.state
    })
    .publishReplay(1).refCount()
  const continue$ = DOM.select(`.appContinueStep1Button`).events(`click`)
    .publishReplay(1).refCount()

  return {
    listing$, 
    continue$
  }
}
