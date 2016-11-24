import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import {combineObj, processHTTP, mergeSinks, createProxy} from '../../../utils'
import Immutable = require('immutable')

import {renderMenuButton, renderCircleSpinner, renderLoginButton, renderSearchCalendarButton} from '../../renderHelpers/navigator'
import {main as Donde} from './donde/main'
import {main as NextButton} from '../nextButton'
import {main as BackNextButtons} from '../backNextButtons'


function createDonde(sources, inputs) {
  const content = Donde(sources, inputs)
  return {
    content,
    controller: NextButton(sources, {...inputs, props$: O.of({next: 'cuando'}), valid$: content.valid$}),
    instruction: getDondeInstruction()
  }
}


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
  const {DOM, Global, Router} = sources

  const retrieval = processHTTP(sources, `retrieveSavedSession`)
  const success_retrieve$ = retrieval.success$
  const error_retrieve$ = retrieval.error$

  const creation = processHTTP(sources, `createNewSession`)
  const success_create$ = creation.success$
  const error_create$ = creation.error$

  const saved = processHTTP(sources, `saveSession`)
  const success_save$ = saved.success$
  const error_save$ = saved.error$

  const push_state$ = Router.history$.map(x => {
    return x.state
  }).publishReplay(1).refCount()

  const open_instruction$ = DOM.select(`.appOpenInstruction`).events(`click`)
  const close_instruction$ = O.merge(
    Global.resize$,
    DOM.select(`.appCloseInstruction`).events(`click`)
  )

  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)
  const save_exit$ = DOM.select(`.appSaveExitButton`).events(`click`)

  return{
    success_retrieve$,
    error_retrieve$,
    success_create$,
    error_create$,
    success_save$,
    error_save$,
    push_state$,
    open_instruction$,
    close_instruction$,
    show_menu$,
    save_exit$
  }
}

function reducers(actions, inputs: any) {
  const open_instruction_r = actions.open_instruction$.map(_ => state => {
    return state.set(`show_instruction`, true)
  })

  const close_instruction_r = actions.close_instruction$.map(_ => state => {
    return state.set(`show_instruction`, false)
  })

  const success_save_r = actions.success_save$.map(val => state => {
    return state.set(``)
  })

  const session_r = inputs.session$.map(session => state => {
    return state.set(`session`, session)
  })

  return O.merge(
    open_instruction_r, close_instruction_r, 
    success_save_r, session_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      authorization$: inputs.Authorization.status$.take(1),
      session$: actions.push_state$.take(1)
    })
    .switchMap((info: any) => {
      const init = Immutable.Map({
        ...info,
        show_instruction: false,
        waiting$: false
      })
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

function getStepHeadingLong(state) {
  const {session} = state
  const {current_step} = session

  if (!current_step || current_step === `donde`) {
    return `Step 1: Select the venue?`
  } else {
    return `Generic heading`
  }
}

function getStepHeadingShort(state) {
  const {session} = state
  const {current_step} = session

  if (!current_step || current_step === `donde`) {
    return `Step 1: Venue`
  } else {
    return `Generic`
  }
}

function renderNavigator(state: any) {
  const {waiting} = state
  return div(`.navigator-section`, [
    div(`.section`, [
      renderMenuButton(),
      span(`.step-description`, [
        span(`.show-lg`, [getStepHeadingLong(state)]),
        span(`.show-sm`, [getStepHeadingShort(state)])
      ])
    ]),
    div(`.section`, [
      div(`.buttons`, [
        waiting ? renderCircleSpinner() : null,
        renderSaveExitButton()
      ])
    ])
  ])
}

function renderMainContent(info: any) {
  return div(`.main-content`, [
    info.components.content
  ])
}

function renderController(info: any) {
  return div(`.controller-buttons`, [
    info.components.controller
  ])
}

function renderInstructionSubpanel(info: any) {
  return div(`.instruction-subpanel`, [
    `Small instruction`
  ])
}

function renderInstructionPanel(info: any) {
  return div(`.instruction-panel`, [
    renderInstructionSubpanel(info)
  ])
}


function renderMainPanelInstructionSection(info) {
  const {state, components} = info
  const {show_instruction} = state
  const {instruction} = components
  return !show_instruction ? div(`.appOpenInstruction.instruction-section.hide`, [
    span(`.icon.fa.fa-lightbulb-o`)
  ]) :
  div(`.instruction-section.show`, [
    span(`.appCloseInstruction.close-icon`),
    span(`.icon.fa.fa-lightbulb-o`),
    instruction
  ])
}

function renderInstructionPanelInstructionSection(info) {
  const {state, components} = info
  const {instruction} = components
  return div(`.instruction-panel`, [
    div(`.instruction-section`, [
      div([
        span(`.icon.fa.fa-lightbulb-o`),
        instruction
      ])
    ])
  ])
}

function view(state$, components) {
  return combineObj({
    state$,
    components$: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    const {show_instruction} = state
    return div(`.create-component`, [
      renderNavigator(state),
      div(`.content-section`, [
        div(`.content`, [
          div(`.main-panel`, [
            renderMainContent(info),
            renderController(info),
            renderMainPanelInstructionSection(info)
          ]),
          renderInstructionPanelInstructionSection(info)
        ])
      ])
    ])
  })
}

function getDondeInstruction() {
  return {
    DOM: O.of(div([`Set the event location`]))
  }
}

function main(sources, inputs) {
  const actions = intent(sources)
  const {push_state$} = actions
  const to_retrieve$ = push_state$
    //.do(x => console.log(`push_state...`, x))
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
    })

  const to_render$ = push_state$.filter(should_render)
    .pluck(`data`)

  const component$ = to_render$
    .map(push_state => {
      //console.log(`push_state`, push_state)
      const {current_step} = push_state 
      if (current_step) {
        switch (current_step) {
          case "donde":
            return createDonde(sources, inputs)
          default:
            throw new Error(`Invalid current step given: ${current_step}`)
        }
      } else {
        return createDonde(sources, inputs)
      }
    }).publishReplay(1).refCount()


  const components = {
    content: component$.switchMap(x => x.content.DOM),
    controller: component$.switchMap(x => x.controller.DOM),
    instruction: component$.switchMap(x => {
      if (x.instruction) {
        return x.instruction.DOM
      } else {
        return O.of(undefined)
      }
    })
  }

  const navigation$ = component$.switchMap(x => x.controller.navigation$)
  const session$ = component$.switchMap(x => {
    return x.content.session$
  })

  //session$.subscribe()
  const state$ = model(actions, {...inputs, session$})


  const vtree$ = view(state$, components)

  

  const to_new$ = push_state$.filter(should_create_new)
    .map(val => {
      return {
        url: `/api/user`,
        method: `post`,
        category: `createNewSession`,
        send: {
          route: `/listing_session/new`
        }
      }
    })

  const to_save_exit$ = actions.save_exit$.withLatestFrom(state$, (_, state) => {
    return {
      url: `/api/user`,
      method: `post`,
      category: `saveListingSession`,
      send: {
        route: `/listing_session/save`,
        data: state.session
      }
    }
  })

  const out = {
     DOM: vtree$,
     MapJSON: component$.switchMap(x => x.content.MapJSON).publish().refCount(),
     HTTP: O.merge(
       to_retrieve$, 
       to_new$,
       to_save_exit$,
       component$.switchMap(x => x.content.HTTP)
     ).publish().refCount(),
      //.do(x => console.log(`to http`, x)),
     Router: O.merge(
       actions.success_save$
         .delay(4)
         .map(val => {
           return {
             pathname: `/home`,
             action: `replace`
           }
         }),
       navigation$.withLatestFrom(state$, (nav, state) => {
         return {
           pathname: `/create/listing`,
           action: `replace`,
           state: {
             type: 'session',
             data: {...state.session, current_step: nav}
           }
         }
       }),
       O.merge(actions.success_retrieve$, actions.success_create$)
         .map(val => {
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
           pathname: `/create`,
           action: `replace`
         }
       })
     ).do(x => console.log(`to router`, x)),
     MessageBus: O.merge(
       actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`}), 
       O.merge(actions.error_retrieve$, actions.error_save$, actions.error_create$)
         .map(error => {
           return {
             to: `main`,
             message: {
               type: `error`,
               data: error
             }
           }
         }),
       actions.success_save$
         .map(_ => {
           return {
             to: `main`,
             message: {
               type: `status`,
               data: `Session saved successfully`
             }
           }
         })
     )
  }

  out.MapJSON.subscribe(x => console.log(`MapJSON`, x))

  return out
}

export {
  main
}