import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, processHTTP, mergeSinks} from '../../../utils'
import Immutable = require('immutable')

import {renderMenuButton, renderCircleSpinner, renderLoginButton, renderSearchCalendarButton} from '../../renderHelpers/navigator'
import {main as Donde} from './donde/main'


function should_retrieve(val) {
  return typeof val === 'object' && val.type === 'retrieve'
}

function should_create_new(val) {
  return typeof val === 'object' && val.type === 'new'
}

function should_render(val: any) {
  return typeof val === 'object' && val.type === 'session'
}

function is_invalid(val) {
  return !(should_render(val) || should_retrieve(val) || should_create_new(val))
}

function intent(sources) {
  const {Router} = sources

  const {success$, error$} = processHTTP(sources, `retrieveSavedSession`)

  const push_state$ = Router.history$.map(x => {
    return x.state
  }).publishReplay(1).refCount()

  return{
    success$,
    error$,
    push_state$
  }
}

function reducers(actions, intent) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, intent)

  return combineObj({
      authorization$: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      const init = Immutable.Map(info)
      return reducer$.startWith(init).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}


function renderCancelButton() {
  return button(`.appCancelButton.text-button.cancel-button`, [`Cancel`])
}

function renderSaveExitButton() {
  return button(`.appSaveExitButton.text-button.save-exit-button`, [`Save/Exit`])
}

function renderNavigator(state: any) {
  //const {authorization} = state
  return div(`.navigator`, [
    div(`.section`, [
      renderMenuButton()
    ]),
    div(`.section`, [
      span([`Create workflow`])
    ]),
    div(`.section`, [
      div(`.buttons`, [
        state.waiting ? renderCircleSpinner() : null,
        renderCancelButton(),
        renderSaveExitButton()
      ])
    ])
  ])
}

function renderContent(info: any) {
  return div(`.content`, [
    info.components.content
  ])
}

function view(state$, components) {
  return combineObj({
    state$,
    components$: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    return div(`.create-component`, [
      renderNavigator(state),
      renderContent(info)
    ])
  })
}


function main(sources, inputs) {
  const actions = intent(sources)
  const {success$, error$, push_state$} = actions
  const to_retrieve$ = push_state$.do(x => console.log(`push_state...`, x)).filter(should_retrieve)
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
    })

  const to_render$ = push_state$.filter(should_render)
    .pluck(`data`)

  const content$ = to_render$
    .map(push_state => {
      console.log(`push_state`, push_state)
      const {current_step} = push_state 
      if (current_step) {
        switch (current_step) {
          case "donde":
            return Donde(sources, inputs)
          default:
            throw new Error(`Invalid current step given: ${current_step}`)
        }
      } else {
        console.log(`donde`)
        return Donde(sources, {...inputs, session: push_state})
      }
    }).publishReplay(1).refCount()

  const state$ = model(actions, inputs)
  const components = {
    content: content$.switchMap(x => x.DOM)
  }

  const vtree$ = view(state$, components)

  

  const to_new$ = push_state$.filter(should_create_new)
    .map(val => {
      return {
        url: `/api/user`,
        method: `post`,
        category: `retrieveSavedSession`,
        send: {
          route: `/listing_session/new`
        }
      }
    })

  return {
     DOM: vtree$,
     HTTP: O.merge(to_retrieve$, to_new$).do(x => console.log(`to http`, x)),
     Router: O.merge(
       success$.map(val => {
         return {
           pathname: `/create/listing`,
           action: `replace`,
           state: {
             type: 'session',
             data: val
           }
         }
       }),
       push_state$.filter(is_invalid).map(x => {
         return {
           pathname: `/`,
           action: `replace`,
           state: {
             error: `Invalid state given to create/listing app`
           }
         }
       })
     ).do(x => console.log(`to router`, x)),
     MessageBus: error$.map(error => {
       return {
         to: `main`,
         message: {
           type: `error`,
           data: error
         }
       }
     })
  }
}

export {
  main
}