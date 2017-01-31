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
  componentify,
  traceStartStop
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

import {main as Basics} from './basics/containerMain'
import {main as Advanced} from './advanced/containerMain'
import {main as Preview} from './preview/newMain'
import {main as NextButton} from '../nextButton'
import {main as BackNextButtons} from '../backNextButtons'
import clone = require('clone')

import {getDefaultSession} from '../../helpers/listing/utils'

function should_retrieve(push_state) {
  return typeof push_state === 'object' && push_state.type === 'retrieve'
}

function should_create_new(push_state) {
  return !push_state
}

function should_render(push_state) {
  return typeof push_state === 'object' && push_state.type === 'session'
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

  const save_stored = processHTTP(sources, `saveStoredSession`)
  const success_save_stored$ = save_stored.success$
    .map(x => {
      return x
    })
  const error_save_stored$ = save_stored.error$
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
    success_save_stored$,
    error_save_stored$,
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

  const yes_auth$ = inputs.Authorization.status$
    .filter(Boolean)
    .map(x => {
      return x
    })
  const no_auth$ = inputs.Authorization.status$
    .filter(x => !x)
    .map(x => {
      return x
    })

  const from_storage$ = yes_auth$.switchMap(_ => sources.Storage.local.getItem('create_listing_session').take(1))
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const stored$ = from_storage$.filter(Boolean).map((x: any) => JSON.parse(x))
    .map(x => {
      return x
    })
  const not_stored$ = from_storage$.filter(x => !x)
    .map(x => {
      return x
    })

  const auth_push_state$ = not_stored$
    .switchMap(_ => push_state$)
    .publishReplay(1).refCount()

  const to_retrieve$ = auth_push_state$
    .filter(should_retrieve)
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


  const to_save_stored$ = stored$.map(session => {
    return {
      url: `/api/user`,
      method: `post`,
      category: `saveStoredSession`,
      send: {
        route: `/listing_session/save`,
        data: session
      }
    }
  })

  const to_http_session$ = O.merge(to_save_stored$, to_retrieve$)
    .delay(1)
    .publish().refCount()

  const no_auth_push_state$ = no_auth$.switchMap(_ => push_state$)
    .publishReplay(1).refCount()

  const to_render$ = O.merge(
    O.merge(auth_push_state$.filter(should_render), no_auth_push_state$.filter(should_render))
      .pluck(`data`)
  ).publishReplay(1).refCount()

  const no_auth_default_session$ = O.merge(
    no_auth_push_state$,
    auth_push_state$
  ).filter(should_create_new)
    .map(x => {
      return getDefaultSession()
    })

  const content$ = to_render$
    .map((push_state: any) => {
      //console.log(`push_state`, push_state)
      const {current_step} = push_state 
      switch (current_step) { 
        case "basics":
          return Basics(sources, {...inputs, session$: O.of(push_state)})
        case "advanced":
          return Advanced(sources, {...inputs, session$: O.of(push_state)})
        case "preview":
          return Preview(sources, {...inputs, session$: O.of(push_state)})
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
  // const mergedRouter = merged.Router
  //   .letBind(traceStartStop('mergedRouter'))
  //   .publish().refCount()
  // merged = {
  //   ...merged,
  //   Router: mergedRouter
  // }

  // mergedRouter.subscribe(x => {
  //   console.log('mergedRouter', x)
  // })

  const to_storage$ = O.merge(
    merged.Storage,
    actions.success_save_stored$.mapTo({
      action: `removeItem`,
      key: `create_listing_session`,
    })
  )



  const out = {
    ...merged,
    DOM: vtree$,
    HTTP: O.merge(
      merged.HTTP,
      to_http_session$
    ),
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
          actions.success_save_stored$
            .map(x => {
              return x
            }).delay(1),  // delay to allow Storage key deletion to occur first
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
        // push_state$
        //   .filter(is_invalid)
        //   .map(x => {
        //     return {
        //       pathname: `/create`,
        //       type: 'replace',
        //       action: `REPLACE`,
        //     }
        //   })
      )
    )
    .do(x => {
      console.log(`to router`, x)
    })
    .delay(1),
    Storage: to_storage$,
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