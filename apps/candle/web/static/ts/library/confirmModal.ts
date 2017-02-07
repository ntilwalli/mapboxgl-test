import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread} from '../utils'

function intent(sources) { 
  const {DOM} = sources
  const close$ = O.merge(
    DOM.select(`.appModalClose`).events(`click`),
    DOM.select(`.appModalBackdrop`).events(`click`)
      .filter(targetIsOwner)
  )
  const confirm$ = DOM.select('.appConfirmButton').events(`click`)
    .map(x => {
      return x
    })
  const confirm_all$ = DOM.select('.appConfirmAllButton').events(`click`)
    .map(x => {
      return x
    })
  const reject$ = DOM.select('.appRejectButton').events(`click`)
    .map(x => {
      return x
    })

  return {
    close$, confirm$, confirm_all$, reject$
  } 
}

function renderModal(info) {
  const {props} = info
  const title = props.title || ``
  const styleClass = props.styleClass || ``
  const message = props.message
  const confirm_message = props.confirm_message
  const confirm_all_message = props.confirm_all_message
  const reject_message = props.reject_message
  return div(`.appModalContainer.modal${styleClass}`, {style: {display: "inline-block"}}, [
    div('.modal-dialog.modal-lg', [
      div(`.modal-content`, [
        div(`.modal-header.container-fluid.m-0`, [
          div('.d-flex.justify-content-between.w-100', [
            div([
              div(`.modal-title.modal-header-text`, [title]),
            ]),
            div('.d-flex.justify-content-end', [
              span(`.appModalClose.close.fa-2x`, [])
            ])
          ])
        ]),
        div(`.modal-body`, [message]),
        div(`.modal-footer`, [
          button('.appRejectButton.btn.btn-outline-warning.d-flex.cursor-pointer', [
            span('.d-flex.align-items-center', [reject_message]),
          ]),
          button('.appConfirmButton.btn.btn-outline-success.d-flex.cursor-pointer', [
            span('.d-flex.align-items-center', [confirm_message]),
          ]),
          confirm_all_message ? button('.appConfirmAllButton.btn.btn-outline-success.d-flex.cursor-pointer', [
            span('.d-flex.align-items-center', [confirm_all_message]),
          ]) : null
        ])
      ])
    ])
  ])
}

function view(props$) { 
  return combineObj({props$})
    .map(info => {
      return div(`.modal-component`, [
        div(`.modal-backdrop`, []),
        renderModal(info)
      ])
    })
}


export default function main(sources, inputs) {

  const actions = intent(sources)
  const {Geolocation, Authorization, settings$, initialState$, props$} = inputs
  return {
    DOM: view(props$),
    close$: O.merge(actions.close$, actions.reject$),
    confirm$: actions.confirm$, 
    confirm_all$: actions.confirm_all$
  }
}
