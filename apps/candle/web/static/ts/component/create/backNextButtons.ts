import {Observable as O} from 'rxjs'
import {div, button} from '@cycle/dom'

function intent(sources) {
  const {DOM} = sources
  const back$ = DOM.select(`.appBackButton`).events(`click`)
    .publish().refCount()
  const next$ = DOM.select(`.appNextButton`).events(`click`)
    .publish().refCount()

  return {
    back$,
    next$,
    navigation$: O.merge(back$.mapTo(`back`), next$.mapTo(`next`))
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
    return div(`.back-next-buttons`, [
      button(`.appBackButton.back`, [`Back`]),
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
        if (nav === `back`) {
          return state.back
        } else {
          return state.next
        }
      })
    )
  }
}

export {
  main
}