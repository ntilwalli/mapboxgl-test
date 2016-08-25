import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import intent from './intent'
import model from './model'
import view from './view'

import {normalizeSink, normalizeSinkUndefined, createProxy, spread} from '../../utils'

import Modal from '../../library/modal/simple/main'
import Vicinity from '../../page/create/workflow/location/vicinity/main'
import Login from '../../library/authorization/login/main'

function getBlankModal() {
  return {
    DOM: O.of(undefined),
    close$: O.never()
  }
}

export default function main(sources, inputs, route) {
  const {DOM} = sources
  const {geolocation$, authorization$} = inputs

  const actions = intent(sources)


  const modalComponent$ = actions.showModal$.startWith(false).map(show => {
    if (show) {
      return isolate(Modal)(sources, spread(
        inputs, {
        component: Login,
        props$: O.of({
          headerText: `Some modal`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else {
      return getBlankModal()
    }
  })
  .cache(1)

  const modalClose$ = modalComponent$.switchMap(x => {
    return x.close$
  })

  const state$ = model(actions, spread(inputs, {close$: modalClose$}))

  return {
    DOM: view(state$, {modal$: normalizeSinkUndefined(modalComponent$, 'DOM')}),
    MapDOM: normalizeSink(modalComponent$, 'MapDOM'),
    Router: normalizeSink(modalComponent$, 'Router'),
    HTTP: normalizeSink(modalComponent$, 'HTTP'),
    Global: normalizeSink(modalComponent$, 'Global'),
    message$: O.merge(
      actions.showLeftMenu$.mapTo({ type: `leftMenu`, data: true})
        .map(x => {
          return x
        }),
      actions.logout$.mapTo({ type: `authorization`, data: {type: `logout`}})
        .map(x => {
          return x
        }),
      //DOM.select(`.login`).events(`click`).constant({ type: `login`, data: { type: `facebook`}})
      actions.login$
        .mapTo({
          type: `authorization`,
          data: {
            type: `login`,
            data: {
              type: `local`,
              data: {
                username: `sanj`,
                password: `sanj`
              }
            }
          }
        })
        .map(x => {
          return x
        }),
      actions.signup$.mapTo({
        type: `individual`,
        name: `Alice Wonderland`,
        email: `alicewonderland@gmail.com`,
        username: `alice`,// + Math.floor(Math.random() * 10000),
        password: `alice`
      })
      .map(x => ({
        type: `authorization`,
        data: {
          type: `signup`,
          data: {
            type: `attempt`,
            data: x
          }
        }
      }))
      .map(x => {
        return x
      }),
      actions.presignup$.mapTo({
        type: `individual`,
        name: `Alice Wonderland`,
        email: `alicewonderland@gmail.com`,
        username: `alice`,// + Math.floor(Math.random() * 10000),
      })
      .map(x => ({
        type: `authorization`,
        data: {
          type: `presignup`,
          data: {
            type: `attempt`,
            data: x
          }
        }
      }))
      .map(x => {
        return x
      })
    )
    .map(x => {
      return x
    })
  }
}
