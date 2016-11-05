import {Observable as O} from 'rxjs'
import {div, span, button, a} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../../utils'

function intent(sources) {
  const {DOM} = sources
  const close$ = O.merge(
    //DOM.select(`.appMenuClose`).events(`click`),
    DOM.select(`.appMenuBackdrop`).events(`click`)
      .filter(targetIsOwner)
  )

  return {
    close$
  }
}

function renderModal(inputs) {
  const {props, component} = inputs
  return div(`.menu-content.left`, [
    div(`.menu-header`, [
      a({props: {href: `/`}}, [`Candle`])
    ]),
    div(`.menu-body`,[component]),
  ])
}

function view(props$, component$) {
  return combineObj({props$, component$})
    .map(inputs => {
      return div(`.menu-component`, [
        div(`.appMenuBackdrop.menu-backdrop`, [
          renderModal(inputs)
        ])
      ])
    })
}

export default function main(sources, inputs) {
  if (!inputs.component || !inputs.props$) {
    throw new Error(`Modal requires both 'component' and 'props$' properties in 'inputs' parameter`)
  }

  const component = inputs.component(sources, inputs)

  if (!component.DOM || !component.Router) {
    throw new Error(`Component requires DOM and output$ sinks.`)
  }

  const normalized = normalizeComponent(component)
  const actions = intent(sources)
  //const state$ = model(actions, inputs)
  return spread(
    normalized, {
    DOM: view(inputs.props$, component.DOM),
    Router: component.Router,
    message$: component.message$,
    close$: O.merge(actions.close$, sources.Router.history$.skip(1))
  })
}
