import {Observable as O} from 'rxjs'
import {div, button} from '@cycle/dom'
import {combineObj} from '../../utils'

function intent(sources) {
  const {DOM} = sources
  const next$ = DOM.select(`.appNextButton`).events(`click`)
    .publish().refCount()

  return {
    navigation$: next$
  }
}

function reducers(actions, inputs) {
  const valid_r = inputs.valid$.skip(1).map(x => state => {
    state.valid = x
    return state
  })

  return O.merge(valid_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    props$: inputs.props$.take(1),
    valid$: inputs.valid$.take(1)
  })
    .switchMap((info: any) => {
      const {valid, props} = info
      const init = {
        valid,
        ...props
      }
      return reducer$.startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    const disabled = !state.valid
    return div(`.next-button-section`, [
      button(`.appNextButton.next`, {attrs: {disabled}, class: {disabled}}, [`Next`])
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
      actions.navigation$.withLatestFrom(state$, (_, state: any) => {
        //console.log(`next button clicked: `, state)
        return state.next
      })
    )
  }
}

export {
  main
}