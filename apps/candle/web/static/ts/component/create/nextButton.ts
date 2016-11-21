import {Observable as O} from 'rxjs'
import {div, button} from '@cycle/dom'

function intent(sources) {
  const {DOM} = sources
  const next$ = DOM.select(`.appNextButton`).events(`click`)
    .publish().refCount()

  return {
    navigation$: next$.mapTo(`next`)
  }
}

function model(actions, inputs) {
  return inputs.props$
    .switchMap(props => {
      return O.never().startWith(props)
        .scan((acc, f: Function) => f(acc))
    })
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    return div(`.next-button-section`, [
      button(`.appNextButton.next`, [`Next`])
    ])
  })
}

function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model({}, inputs)
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    navigation$: O.merge(
      actions.navigation$.withLatestFrom(state$, (nav, state: any) => {
        return state.next
      })
    )
  }
}

export {
  main
}