import {Observable as O} from 'rxjs'
import {div, pre, span, input, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'
import {inflateDates, fromCheckbox} from '../helpers'

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .map(x => x.state.data)
    .map(inflateDates)
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

function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {session} = state
      const {listing} = session
      const {type, meta, event_types, categories} = listing
      const {title, description} = meta

      return div(`.workflow-step.preview`, [
        div(`.heading`, ['Preview listing']),
        div(`.body`, [
          pre('.column', [JSON.stringify(listing, null, 2)]),
          div('.column', [
            button('.appPostButton.outline-button.medium', [
              div('.flex.align-center', [
                'Post'
              ])
            ])
          ])
        ])
      ])
    })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$, {})
  return {
    DOM: vtree$,
    output$: state$
  }
}
