import {Observable as O} from 'rxjs'

export default function intent(sources) {

  const {Router, DOM} = sources
  const listing$ = Router.history$.take(1)
    .map(route => {
      return route.state
    })
    .cache(1)
  const continue$ = DOM.select(`.appContinueStep1Button`).events(`click`)
    .cache(1)

  return {
    listing$, 
    continue$
  }
}
