import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, span, button} from '@cycle/dom'
import {combineObj, normalizeComponent, targetIsOwner, createProxy, spread, processHTTP} from '../utils'

import {renderSKFadingCircle6} from './spinners'

function intent(sources) { 
  const {DOM} = sources
  const close$ = O.merge(
      DOM.select('.appModalClose').events('click'),
      DOM.select('.appModalContainer').events('click')
        .filter(x => {
          return targetIsOwner(x)
        })
    )
    .map(x => {
      return x
    })
    .publish().refCount()

  //close$.subscribe()

  const confirm$ = DOM.select('.appConfirmButton').events(`click`)
    .map(x => {
      return x
    })
    .publish().refCount()
  const confirm_all$ = DOM.select('.appConfirmAllButton').events(`click`)
    .map(x => {
      return x
    })
    .publish().refCount()
  const reject$ = DOM.select('.appRejectButton').events(`click`)
    .map(x => {
      return x
    })
    .publish().refCount()

  return {
    close$, confirm$, confirm_all$, reject$
  } 
}

function reducers(actions, inputs) {
  const waiting_r = O.merge(actions.confirm$.mapTo('confirm'), actions.confirm_all$.mapTo('confirm_all'))
    .map(type => state => state.set('waiting', type))

  return O.merge(waiting_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      session$: inputs.session$,
      props$: inputs.props$
    })
    .switchMap((init: any) => {
      return reducer$
        .startWith(Immutable.fromJS({...init, waiting: false}))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function renderModal(info) {
  const {state} = info
  const {props, waiting} = state
  const title = props.title || ``
  const styleClass = props.styleClass || ``
  const message = props.message
  const confirm_message = props.confirm_message
  const confirm_all_message = props.confirm_all_message
  const reject_message = props.reject_message
  return div('.appModalContainer.modal' + styleClass, {style: {display: "inline-block"}}, [
    div('.modal-dialog.modal-lg', [
      div('.modal-content', [
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
            span('.d-flex.align-items-center', [waiting === 'confirm' ? renderSKFadingCircle6() : confirm_message]),
          ]),
          confirm_all_message ? button('.appConfirmAllButton.btn.btn-outline-success.d-flex.cursor-pointer', [
            span('.d-flex.align-items-center', [waiting === 'confirm_all' ? renderSKFadingCircle6() : confirm_all_message]),
          ]) : null
        ])
      ])
    ])
  ])
}

function view(state$) { 
  return combineObj({state$})
    .map(info => {
      return div(`.modal-component`, [
        div(`.modal-backdrop`, []),
        renderModal(info)
      ])
    })
}


export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const muxed_http_confirm = processHTTP(sources, 'confirm')
  const muxed_http_confirm_all = processHTTP(sources, 'confirmAll')

  const to_http$ =  O.merge(
    actions.confirm$
      .withLatestFrom(state$, (_, state: any) => {
        return {
          url: `/api/user`,
          method: `post`,
          category: 'confirm',
          send: {
            route: state.props.route_confirm,
            data: state.props.converter_confirm(state.session)
          }
        }
      }),
    actions.confirm_all$
      .withLatestFrom(state$, (_, state: any) => {
        return {
          url: `/api/user`,
          method: `post`,
          category: 'confirmAll',
          send: {
            route: state.props.route_confirm_all,
            data: state.props.converter_confirm_all(state.session)
          }
        }
      })
  )

  const error$ = O.merge(muxed_http_confirm.error$, muxed_http_confirm_all.error$).publish().refCount()

  return {
    DOM: view(state$),
    HTTP: to_http$,
    MessageBus: error$
      .map(status => {
        return {
          to: 'main',
          message: {
            type: 'error',
            data: status
          }
        }
      }),
    close$: O.merge(
      actions.close$, 
      actions.reject$, 
      error$.map(x => {
        return x
      })
    ).publish().refCount(),
    confirm$: muxed_http_confirm.success$.map(x => {
        return x
      }).publish().refCount(), 
    confirm_all$: muxed_http_confirm_all.success$.map(x => {
        return x
      }).publish().refCount()
  }
}
