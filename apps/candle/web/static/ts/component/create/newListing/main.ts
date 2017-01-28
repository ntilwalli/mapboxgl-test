import {Observable as O} from 'rxjs'
import {div, span, button, hr, nav} from '@cycle/dom'
import Immutable = require('immutable')
import {ListingTypes, deflateSession} from '../../helpers/listing/utils'
import moment = require('moment')
import deepEqual = require('deep-equal')

import {
  combineObj, 
  processHTTP, 
  mergeSinks, 
  createProxy,
  normalizeComponent,
  componentify
} from '../../../utils'

import {
  renderMenuButton, 
  renderCircleSpinner, 
  renderLoginButton, 
  renderSearchCalendarButton
} from '../../helpers/navigator'

import Navigator from '../../../library/navigators/createStep'


import {
  renderSKFadingCircle6
} from '../../../library/spinners'

import {main as Basics} from './basics/main'
import {main as Advanced} from './advanced/newMain'
import {main as Preview} from './preview/newMain'
import {main as NextButton} from '../nextButton'
import {main as BackNextButtons} from '../backNextButtons'
import clone = require('clone')

import {getDefaultSession} from '../../helpers/listing/utils'

function should_retrieve({authorization, push_state}) {
  return authorization && typeof push_state === 'object' && push_state.type === 'retrieve'
}

function should_create_new({authorization, push_state}) {
  return authorization && !push_state
}

function should_render({authorization, push_state}) {
  return typeof push_state === 'object' && push_state.type === 'session'
}

function should_retrieve_from_storage({authorization, push_state}) {
  return !authorization && !push_state
}

function is_invalid(val) {
  return !val
}

function intent(sources) {
  const {DOM, Global, Router} = sources

  const retrieval = processHTTP(sources, `retrieveSavedSession`)
  const success_retrieve$ = retrieval.success$
    .map(x => {
      return x
    })
  const error_retrieve$ = retrieval.error$
    .map(x => {
      return x
    })

  const creation = processHTTP(sources, `createNewSession`)
  const success_create$ = creation.success$
    .map(x => {
      return x
    })
  const error_create$ = creation.error$
    .map(x => {
      return x
    })

  const push_state$ = Router.history$.map(x => {
    return x.state
  }).publishReplay(1).refCount()

  const from_http$ = O.merge(success_retrieve$, success_create$)

  return{
    from_http$,
    success_retrieve$,
    error_retrieve$,
    success_create$,
    error_create$,
    push_state$
  }
}

function reducers(actions, inputs: any) {

  const waiting_r = inputs.to_http$.map(val => state => {
    return state.set(`waiting`, true)
  })

  const done_waiting_r = actions.from_http$.map(val => state => {
    return state.set(`waiting`, false)
  })

  return O.merge(
    waiting_r, done_waiting_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return O.of(undefined)
    .switchMap((info: any) => {
      const init = Immutable.fromJS({
        waiting: false
      })
      return reducer$.startWith(init).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function view(state$, components) {
  return combineObj({
    state$,
    components$: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    const {waiting} = state
    const {navigator, content} = components
    return div(`.screen.create-component`, {
    }, [
      waiting ? div([
        navigator
      ]) : div(
        {
          // hook: {
          //   create: () => window.scrollTo(0, 0),
          //   update: () => window.scrollTo(0, 0)
          // }
        },
      [
        navigator,
        content
      ])
    ])
  })
}

function main(sources, inputs) {
  const actions = intent(sources)
  const {push_state$} = actions
  const auth_push_state$ = combineObj({
    authorization$: inputs.Authorization.status$,
    push_state$
  }).publishReplay(1).refCount()

  const to_retrieve$ = auth_push_state$
    .filter(should_retrieve)
    .map((info: any) => info.push_state)
    .pluck(`data`)
    .map(val => {
      return {
        url: `/api/user`,
        method: `post`,
        category: `retrieveSavedSession`,
        send: {
          route: `/listing_session/retrieve`,
          data: val
        }
      }
    }).publishReplay(1).refCount()

  const to_new$ = auth_push_state$
    .filter(should_create_new)
    .map((info: any) => info.push_state)
    .map(val => {
      return {
        url: `/api/user`,
        method: `post`,
        category: `createNewSession`,
        send: {
          route: `/listing_session/new`
        }
      }
    }).publishReplay(1).refCount()

  const to_http_session$ = O.merge(to_new$, to_retrieve$)
    .delay(1)
    .publish().refCount()

  const to_render$ = auth_push_state$
    .filter((x: any) => should_render(x))
    .map((info: any) => info.push_state)
    .pluck(`data`)
    .publishReplay(1).refCount()

  const from_storage$ = auth_push_state$
    .filter((x: any) => should_retrieve_from_storage(x))
    .switchMap(_ => sources.Storage.local.getItem('create_listing_session').take(1))
    .publishReplay(1).refCount()

  const stored_session$ = from_storage$
    .filter(Boolean)
    .publishReplay(1).refCount()

  const no_stored_session$ = from_storage$
    .filter(x => !x)

  const no_auth_default_session$ = no_stored_session$
    .map(x => {
      return getDefaultSession()
    })



  const content$ = to_render$
    .map((push_state: any) => {
      //console.log(`push_state`, push_state)
      const {current_step} = push_state 
      switch (current_step) { 
        case "basics":
          return Basics(sources, inputs)
        case "advanced":
          return Advanced(sources, inputs)
        case "preview":
          return Preview(sources, inputs)
        default:
          throw new Error(`Invalid current step given: ${current_step}`)
      }
    })
    //.do(x => console.log(`component$...`, x))
    .publishReplay(1).refCount()

  const navigator = Navigator(sources, {...inputs, current_step$: to_render$.pluck('current_step')})

  const content = componentify(content$)
  const components = {
    content: content.DOM,
    navigator: navigator.DOM
  }

  const waiting$ = createProxy()

  const state$ = model(actions, {...inputs, to_http$: waiting$})
  const vtree$ = view(state$, components)

  //waiting$.attach(to_http$)

  const merged = mergeSinks(content, navigator)
  const to_http$ = O.merge(
    merged.HTTP,
    to_http_session$,
  ).publish().refCount()

  // to_http$.subscribe(x => {
  //   console.log('to_http', x)
  // })

  const out = {
    ...merged,
    DOM: vtree$,
    HTTP: to_http$,
    Router: O.merge(
      merged.Router,
      O.merge(
        O.merge(
          actions.success_retrieve$
            .map(val => {
              return val
            }),
          actions.success_create$
            .map(val => {
              return getDefaultSession(val)
            }),
          stored_session$
            .map(x => {
              return x
            }),
          no_auth_default_session$
            .map(x => {
              return x
            }),
        )
        .map(session => {
            return {
              pathname: `/create/listing`,
              type: 'replace',
              action: `REPLACE`,
              state: {
                type: 'session',
                data: session
              }
            }
          }),
        push_state$
          .filter(is_invalid)
          .map(x => {
            return {
              pathname: `/create`,
              type: 'replace',
              action: `REPLACE`,
            }
          })
      )
    )
    .do(x => {
      console.log(`to router`, x)
    }),
    MessageBus: O.merge(
      merged.MessageBus,
      O.merge(actions.error_retrieve$, actions.error_create$)
        .map(error => {
          return {
            to: `main`,
            message: {
              type: `error`,
              data: error
            }
          }
        })
    )
  }

  //out.MapJSON.subscribe(x => console.log(`MapJSON`, x))

  return out
}

export {
  main
}