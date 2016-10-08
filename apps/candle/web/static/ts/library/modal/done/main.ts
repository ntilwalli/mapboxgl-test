import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../../../utils'

function intent(sources) { 
  const {DOM} = sources
  const close$ = O.merge(
    DOM.select(`.appModalClose`).events(`click`),
    DOM.select(`.appModalBackdrop`).events(`click`)
      .filter(targetIsOwner)
  )
  const done$ = DOM.select(`.appDoneButton`).events(`click`)
    .map(x => {
      return x
    })

  return {
    close$, done$
  } 
}

function renderModal(inputs) {
  const {props, component} = inputs
  const {alwaysShowHeader} = props
  const headerText = props.headerText || ``
  const modalType = props.type || 'standard'
  return div(`.modal-dialog`, [
    div(`.modal-content`, [
      div(`.modal-header${!alwaysShowHeader ? `.hidden-md-up` : ''}`, [
        div(`.modal-title.modal-header-text`, [headerText]),
        modalType === `standard` ? span(`.appModalClose.close.fa-2x`, [`×`]) : null
      ]),
      div(`.modal-body`, [component]),
      div(`.modal-footer`, [
        button(`.appDoneButton`, [`Done`])
      ])
    ])
  ])
}

function view(props$, component$) {
  return combineObj({props$, component$})
    .map(inputs => {
      return div(`.modal-component`, [
        div(`.appModalBackdrop.modal-backdrop`, [
          renderModal(inputs)
        ])
      ])
    })
}

/**
 * @param {string} component - the component to be rendered inside modal
 *   Expects component to output DOM sink, and output$ (real-time component state)
 * @param {object} props$ - property stream
 *   Expects:
 *     alwaysShowHeader: boolean (default: false)
 *     modalType: string (default: `standard`) `standard` || `decision`
 *     headerText: string (default: ``)
 */
export default function main(sources, inputs) {
  if (!inputs.component || !inputs.props$) {
    throw new Error(`Modal requires both 'component' and 'props$' properties in 'inputs' parameter`)
  }

  const component = inputs.component(sources, inputs)

  if (!component.DOM || !component.output$) {
    throw new Error(`Component requires DOM and output$ sinks.`)
  }

  const holdOutput$ = component.output$.publishReplay(1).refCount()
  const normalized = normalizeComponent(component)
  const actions = intent(sources)
  return spread(
    normalized, {
    DOM: view(inputs.props$, component.DOM)
      .map(x => {
        return x
      }),//component.DOM),
    output$: holdOutput$,
    close$: actions.close$,
    done$: actions.done$.withLatestFrom(holdOutput$, (_, output) => output)

  })
}
