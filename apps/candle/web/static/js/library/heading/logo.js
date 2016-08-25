import {Observable as O} from 'rxjs'
import {div, button} from '@cycle/dom'
import {normalizeComponent} from '../../utils'

function intent(sources) {
  const {DOM} = sources
  return {
    openMenu$: DOM.select(`.appOpenMenuButton`).events(`click`),
    goHome$: DOM.select(`.appHomeButton`).events(`click`)
  }
}

function model(actions, inputs) {
  return O.of({}).cache(1)
}

function view(state$) {
  return state$.map(state => {
    return div(`.logo-icon`, [
      div(`.hidden-sm-down`, [
        button(`.appHomeButton.comp.logo.logo-large`)
      ]),
      div(`.hidden-md-up`, [
        button(`.appOpenMenuButton.comp.logo.logo-small`)
      ])
    ])
  })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)
  return normalizeComponent({
    DOM: vtree$,
    Router: actions.goHome$.map(() => ({
      pathname: `/`,
      action: `PUSH`
    })),
    message$: actions.openMenu$.map(() => ({
      type: `leftMenu`
    })),
  })
}