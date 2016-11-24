import {Observable as O} from 'rxjs'
import {targetIsOwner, combineObj} from '../../../../utils'

export default function intent(sources) {
  const {DOM, Router} = sources
  const showSearchAreaScreen$ = DOM.select(`.appChangeSearchAreaButton`).events(`click`)
    .mapTo(true)

  const session$ = Router.history$
    .map(x => x.state)
    .publishReplay(1).refCount()

  return {
    showSearchAreaScreen$,
    session$
  }
}
