import {Observable as O} from 'rxjs'
import {div, button, a, ul, li} from '@cycle/dom'
import Immutable from 'immutable'

function intent(sources) {
  const {DOM} = sources
  const logout$ = DOM.select(`.appLogOut`).events(`click`)
  return {
    logout$
  }
}

function reducers(actions, intent) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.authorization$
    .switchMap(authorization => {
      const initialState = {
        authorization
      }

      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    .publishReplay(1).refCount()
}

function renderBody(state) {
  if (state.authorization) {
    return ul(`.authorized`, [
      li([
        a({props: {href: `/create`}}, [`Create new`])
      ]),
      li([
        button(`.appLogOut.menu-link`, [`Log out`])
      ])
    ])
  } else {
    return ul(`.not-authorized`, [
      li([
        a({props: {href: `/?modal=login`}}, [`Log in`])
      ]),
      li([
        a({props: {href: `/?modal=signup`}}, [`Sign up`])
      ])
    ])
  }
}

function view(state$) {
  return state$.map(state => {
    return renderBody(state)
  })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)

  return {
    DOM: vtree$,
    Router: O.never(),
    message$: actions.logout$.map(x => ({
      type: `authorization`,
      data: {type:`logout`}
    }))
    .map(x => {
      return x
    })
  }
}