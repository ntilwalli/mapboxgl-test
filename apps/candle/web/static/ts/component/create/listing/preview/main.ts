import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'
import mapview from './mapview'
import view from './view'
import {inflateSession, fromCheckbox} from '../../../helpers/listing/utils'

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .map(x => x.state.data)
    .map(inflateSession)
    .publishReplay(1).refCount()
  
  const attempt_post$ = DOM.select('.appPostButton').events('click')

  return {
    session$,
    attempt_post$
  }
}

function reducers(actions, inputs) {
  return O.merge(O.never())
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1)
    })
    .switchMap((info: any) => {
      //console.log('meta init', info)
      const session = info.session
      const init = {
        session 
      }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .map((x: any) => ({
      ...x,
      valid: true
    }))
    //.do(x => console.log(`preview state`, x))
    .publishReplay(1).refCount()
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const mapvtree$ = mapview(state$)
  const vtree$ = view(state$, {})
  return {
    DOM: vtree$,
    MapJSON: mapvtree$,
    output$: state$
  }
}
