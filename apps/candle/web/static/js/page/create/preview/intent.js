import {Observable as O} from 'rxjs'
import {inflate} from '../listing'

export default function intent(sources) {
  const {DOM, Router} = sources

  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .map(x => {
      return inflate(x)
    })
    .publishReplay(1).refCount()

  const customize$ = DOM.select(`.appCustomizeButton`).events(`click`)
  const stage$ = DOM.select(`.appStageButton`).events(`click`)
  const post$ = DOM.select(`.appPostButton`).events(`input`)
  


  return {
    customize$, stage$, post$, listing$
  }
}