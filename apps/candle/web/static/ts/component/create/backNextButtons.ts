import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj} from '../../utils'

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
  return combineObj({
      props$: inputs.props$,
      valid$: inputs.valid$
    })
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    //console.log(`button state`, state)
    const {props, valid} = state
    return div(`.back-next`, [
      div(`.button-section.back-section`, [
        props.back ? button(`.appBackButton.back`, [
          span(`.icon.fa.fa-angle-left.fa-2x`),
          span(`.text`, [`Back`]),
        ]) : null
      ]),
      span(`.vertical-separator`, []),
      div(`.button-section.next-section`, [
        props.next ? button(`.appNextButton.next`, {class: {disabled: !valid}}, [
          span(`.text`, [`Next`]),
          span(`.icon.fa.fa-angle-right.fa-2x`)
        ]) : null
      ])
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
          return state.props.back
        } else {
          return state.props.next
        }
      })
    )
  }
}

export {
  main
}