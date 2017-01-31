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
  const done$ = DOM.select(`.appDoneButton`).events(`click`)
    .map(x => {
      return x
    })

  return {
    close$, done$
  } 
}







// function renderModal(info) {
//   const {props, content} = info
//   const title = props.title || ``
//   const styleClass = props.styleClass || ``
//   return div(`.modal-dialog${styleClass}`, [
//     div(`.modal-content`, [
//       div(`.modal-header`, [
//         div(`.modal-title.modal-header-text`, [title]),
//         span(`.appModalClose.close.fa-2x`, [`×`])
//       ]),
//       div(`.modal-body`, [content]),
//       div(`.modal-footer`, [
//         button(`.appDoneButton`, [`Done`])
//       ])
//     ])
//   ])
// }

// function view(props$, content$) {
//   return combineObj({props$, content$})
//     .map(info => {
//       return div(`.modal-component`, [
//         div(`.appModalBackdrop.modal-backdrop`, [
//           renderModal(info)
//         ])
//       ])
//     })
// }


function renderModal(info) {
  const {props, content} = info
  const title = props.title || ``
  const styleClass = props.styleClass || ``
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
        div(`.modal-body`, [content]),
        div(`.modal-footer`, [
          button(`.appDoneButton`, [`Done`])
        ])
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

  return {
    ...content,
    DOM: view(inputs.props$, content.DOM),
    output$,
    close$: actions.close$,
    done$: actions.done$.withLatestFrom(output$, (_, output) => output)
  }
}
