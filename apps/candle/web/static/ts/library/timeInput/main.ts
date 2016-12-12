import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'

import intent from './intent'
import model from './model'
import view from './view'

import {getTimeFromStateInfo} from './utils'

function main(sources, inputs) {

  const actions = intent(sources)
  const props$ = inputs.props$ || O.of(undefined)
  const state$ = model(actions, {...inputs, props$})
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    output$: state$
      .map((state: any) => {
        const {currentTime} = state
        return currentTime
      })
      .distinctUntilChanged(null, x => x ? getTimeFromStateInfo(x).toISOString() : x)
      .publishReplay(1).refCount()
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)