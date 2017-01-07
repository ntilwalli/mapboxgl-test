import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../utils'

function intent(sources) { 
  const {DOM} = sources
  const close$ = O.merge(
    DOM.select(`.appModalClose`).events(`click`),
    DOM.select(`.appModalContainer`).events(`click`)
      .filter(targetIsOwner)
  )

  return {
    close$
  } 
}

function renderModal(info) {
  const {props, content} = info
  const title = props.title || ``
  const styleClass = props.styleClass || ``
  return div(`.appModalContainer.modal${styleClass}`, {style: {display: "inline-block"}}, [
    div('.modal-dialog.modal-lg', [
      div(`.modal-content`, [
        div(`.modal-header`, [
          div(`.modal-title.modal-header-text`, [title]),
          span(`.appModalClose.close.fa-2x`, [])
        ]),
        div(`.modal-body`, [content])
      ])
    ])
  ])
}

function view(props$, content$) {
  return combineObj({props$, content$})
    .map(info => {
      return div(`.modal-component`, [
        div(`.modal-backdrop`, []),
        renderModal(info)
      ])
    })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const {Geolocation, Authorization, settings$, initialState$} = inputs
  const content = inputs.content(sources, {props$: initialState$, Geolocation, Authorization, settings$}) 
  const output$ = content.output$

  return spread(content, {
    DOM: view(inputs.props$, content.DOM),
    MessageBus: O.merge(content.MessageBus, actions.close$.mapTo({to: `main`, message: `hideModal`})),
  })
}
