import {Observable as O} from 'rxjs'
import {inflate} from '../listing'
import {processHTTP} from '../../../utils'

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
  const post$ = DOM.select(`.appPostButton`).events(`click`)

  const postResponses = processHTTP(sources, `postListing`)

  const postSuccess$ = postResponses.good$
    .filter(x => x.type === `success`)
    .publish().refCount()

  const postError$ = postResponses.good$
    .filter(x => x.type === `error`)
    .publish().refCount()

  const postProblem$ = O.merge(postResponses.bad$, postResponses.ugly$)
    .map(x => ({
      type: `problem`,
      data: x
    }))

  const stageResponses = processHTTP(sources, `stageListing`)
  const stageSuccess$ = stageResponses.good$
    .filter(x => x.type === `success`)
    .publish().refCount()

  const stageError$ = stageResponses.good$
    .filter(x => x.type === `error`)
    .publish().refCount()

  const stageProblem$ = O.merge(stageResponses.bad$, stageResponses.ugly$)
    .map(x => ({
      type: `problem`,
      data: x
    }))
  
  return {
    customize$, stage$, post$, listing$,
    postSuccess$, postError$, postProblem$,
    stageSuccess$, stageError$, stageProblem$
  }
}