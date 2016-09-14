import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import intent from './intent'
import model from './model'
import view from './view'

import {normalizeSink, createProxy, spread} from '../../utils'

import Modal from '../../library/modal/done/main'

function getBlankModal() {
  return {
    DOM: O.of(undefined),
    done$: O.never(),
    close$: O.never()
  }
}

export default function main(sources, inputs, route) {
  const {DOM} = sources
  const {geolocation$, authorization$} = inputs

  // const close$ = createProxy()
  // const done$ = createProxy()

  const actions = intent(sources)


  const modalComponent$ = actions.showModal$.startWith(false).map(show => {
    if (show) {
      return isolate(Modal)(sources, spread(inputs, {
        component: (sources, inputs) => ({
          DOM: O.of(div([`Modal content`])),
          output$: O.of(``)
        }),
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
  .publishReplay(1).refCount()

  const modal$ = modalComponent$.switchMap(x => {
    return x.DOM
  })
  const modalClose$ = modalComponent$.switchMap(x => {
    return x.close$
  })
  const modalDone$ = modalComponent$.switchMap(x => {
    return x.done$
  })


  const state$ = model(actions, spread(inputs, {close$: modalClose$, done$: modalDone$}))

  // close$.attach(modalClose$)
  // done$.attach(modalDone$)

  // const aMessage$ = inputs.message$.filter(x => x.type ===`authorization`).map(x => x.data).publish().refCount()
  // const loginMessage$ = aMessage$.filter(x => x.type === `login`).map(x => x.data)
  // const signupMessage$ = aMessage$.filter(x => x.type === `signup`).map(x => x.data)
  // const inMessage$ = most.merge(loginMessage$, signupMessage$)
  //   .subscribe(x => {
  //     console.log(`fromServices message: `, x)
  //     return x;
  //   })

  return {
    DOM: view(state$, {modal$}),
    Router: O.never(),
    HTTP: O.never(),
    message$: O.merge(
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
  }
}
