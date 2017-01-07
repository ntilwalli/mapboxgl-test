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

import {
  renderSKFadingCircle6
} from '../../../library/spinners'

import {main as Meta} from './meta/main'
import {main as Donde} from './dondeWithModalRouting/main'//NoModal'
import {main as Cuando} from './cuando/main'
import {main as Properties} from './properties/main'
import {main as Preview} from './preview/main'
import {main as NextButton} from '../nextButton'
import {main as BackNextButtons} from '../backNextButtons'
import clone = require('clone')


function createMeta(sources, inputs) {
  const content = Meta(sources, inputs)
  return {
    content,
    buttons: BackNextButtons(sources, {...inputs, props$: O.of({next: 'donde'}), valid$: content.output$.pluck(`valid`)}),
    instruction: MetaInstruction(),
    small_instruction: MetaInstruction()
  }
}

function createDonde(sources, inputs) {
  const content = Donde(sources, inputs)
  return {
    content,
    buttons: BackNextButtons(sources, {...inputs, props$: O.of({back: `meta`, next: 'cuando'}), valid$: content.output$.pluck(`valid`)}),
    instruction: DondeInstruction(),
    small_instruction: DondeInstruction()
  }
}

function createCuando(sources, inputs) {
  const content = Cuando(sources, inputs)
  return {
    content,
    buttons: BackNextButtons(sources, {...inputs, props$: O.of({back: `donde`, next: 'properties'}), valid$: content.output$.pluck(`valid`)}),
    instruction: CuandoInstruction(),
    small_instruction: CuandoInstruction()
  }
}

function createProperties(sources, inputs) {
  const content = Properties(sources, inputs)
  return {
    content,
    buttons: BackNextButtons(sources, {...inputs, props$: O.of({back: 'cuando', next: 'preview'}), valid$: content.output$.pluck(`valid`)}),
    instruction: PropertiesInstruction(),
    small_instruction: PropertiesInstruction()
  }
}

function createPreview(sources, inputs) {
  const content = Preview(sources, inputs)
  return {
    content,
    buttons: BackNextButtons(sources, {...inputs, props$: O.of({back: 'properties'}), valid$: content.output$.pluck(`valid`)}),
    instruction: PreviewInstruction(),
    small_instruction: PreviewInstruction()
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

  const saved_exit = processHTTP(sources, `saveExitSession`)
  const success_save_exit$ = saved_exit.success$
  const error_save_exit$ = saved_exit.error$

  const saved = processHTTP(sources, `saveSession`)
  const success_save$ = saved.success$
  const error_save$ = saved.error$


  const push_state$ = Router.history$.map(x => {
    return x.state
  }).publishReplay(1).refCount()

  const open_instruction$ = DOM.select(`.appOpenInstruction`).events(`click`)
  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)
  const close_instruction$ = O.merge(
    Global.resize$,
    DOM.select(`.appCloseInstruction`).events(`click`)
  )

  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)
  const save_exit$ = DOM.select(`.appSaveExitButton`).events(`click`)
  const from_http$ = O.merge(success_save$, success_save_exit$)
  return{
    from_http$,
    success_retrieve$,
    error_retrieve$,
    success_create$,
    error_create$,
    success_save_exit$,
    success_save$,
    error_save_exit$,
    error_save$,
    push_state$,
    open_instruction$,
    close_instruction$,
    show_menu$,
    save_exit$,
    brand_button$
  }
}

function reducers(actions, inputs: any) {
  const open_instruction_r = actions.open_instruction$.map(_ => state => {
    return state.set(`show_instruction`, true)
  })

  const close_instruction_r = actions.close_instruction$.map(_ => state => {
    return state.set(`show_instruction`, false)
  })

  const saving_r = inputs.saving$.map(val => state => {
    return state.set(`waiting`, true)
  })

  const saved_r = actions.from_http$.map(val => state => {
    return state.set(`waiting`, false).set('last_saved', moment())
  })

  const session_r = inputs.session$.map(session => state => {
    //console.log(`updated workflow session`, session)
    return state.set(`session`, Immutable.fromJS(session))
  })

  return O.merge(
    open_instruction_r, close_instruction_r, 
    saving_r, saved_r, session_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      authorization$: inputs.Authorization.status$.take(1),
      session$: actions.push_state$.take(1)
    })
    .switchMap((info: any) => {
      const init = Immutable.fromJS({
        ...info,
        show_instruction: false,
        last_saved: undefined,
        waiting: false
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

function getStepHeading(state) {
  const {session} = state
  const {listing} = session
  const {type} = listing
  const {current_step} = session

  switch (current_step) {
    case 'meta':
      return 'Step 1/5: Meta stuff'
    case 'donde':
      return 'Step 2/5: Set the venue'
    case 'cuando':
      if (type === ListingTypes.RECURRING) {
        return 'Step 3/5: Set the recurrence'
      } else {
        return 'Step 3/5: Select the date and time'
      }
    case 'properties':
      return 'Step 4/5: Set the listing properties'
    case 'preview':
      return 'Step 5/5: Preview and post '
    default:
      return `Generic heading`
  }
}

function getSmallStepHeading(state) {
  const {session} = state
  const {listing} = session
  const {type} = listing
  const {current_step} = session

  switch (current_step) {
    case 'meta':
      return 'Basics'
    case 'donde':
      return 'Venue'
    case 'cuando':
      if (type === ListingTypes.RECURRING) {
        return 'Recurrence'
      } else {
        return 'When'
      }
    case 'properties':
      return 'Properties'
    case 'preview':
      return 'Preview'
    default:
      return `Generic heading`
  }
}


function renderNavigator(state) {
  const {authorization, waiting} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid.pos-f-t', [
    div('.row.no-gutter', [
      div('.col-xs-6', [
        button('.appBrandButton.hopscotch-icon.nav-brand', []),
        span('.ml-1.hidden-sm-down.step-description', [getStepHeading(state)]),
        span('.ml-1.hidden-md-up.step-description', [getSmallStepHeading(state)])
      ]),
      div('.col-xs-6.d-fx-a-c.fx-j-e', [
        waiting ? span('.mr-1', [renderSKFadingCircle6()]) : null,
        button(`.appSaveExitButton.text-button.nav-text-button.btn.btn-link`, [`Save/Exit`])
      ]),
    ])
  ])
}

function renderMainPanel(info: any) {
  return div(`.main-panel.container-fluid.mt-1`, {
    // hook: {
    //   create: (emptyVNode, {elm}) => {
    //     elm.scrollTop = 0
    //   }
    // }
  }, [
    info.components.content
  ])
}

function renderButtonPanel(info: any) {
  return div(`.button-panel`, [
    //hr(`.separator`),
      info.components.buttons,
      renderSmallInstructionPanel(info)
  ])
}

function renderInstructionPanel(info: any) {
  return div(`.instruction-panel`, [
    renderInstructionSubpanel(info)
  ])
}


function renderSmallInstructionPanel(info) {
  const {state, components} = info
  const {show_instruction} = state
  const {small_instruction} = components
  return div('.small-instruction-panel', {
      class: {
        appOpenInstruction: !show_instruction,
        rounded: show_instruction,
        'rounded-circle': !show_instruction
        //hide: !show_instruction
      }
    }, [
      div('.clearfix', [span(`.appCloseInstruction.close.float-xs-right`, {style: {display: !!show_instruction ? 'inline' : 'none'}}, []),
      span(`.icon.fa.fa-lightbulb-o`)]),
      div({style: {display: !!show_instruction ? 'block' : 'none'}}, [small_instruction])
    ])
  //   div(`.appOpenInstruction.small-instruction`, {
  //     style: {
  //       display: !show_instruction ? 'block' : 'none'
  //     }
  //   }, [
  //     span(`.icon.fa.fa-lightbulb-o`, [])
  //   ]), div({
  //     style: {
  //       display: !!show_instruction ? 'block' : 'none'
  //     }
  //   }, [
  //     button(`.appCloseInstruction.close`),
  //     span(`.icon.fa.fa-lightbulb-o`),
  //     small_instruction
  //   ])
  // ])
}

function renderInstructionSubpanel(info) {
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
    return div(`.screen.create-component`, [
      renderNavigator(state),
      div('.content-section.nav-fixed-offset', [
        renderMainPanel(info),
        renderButtonPanel(info),
        renderInstructionPanel(info)
      ])
    ])
  })
}

function getMetaInstruction() {
  return 'Title + type'
}

function MetaInstruction() {
  return {
    DOM: O.of(div([getMetaInstruction()]))
  }
}

function getDondeInstruction() {
  return `Set the event location`
}

function DondeInstruction() {
  return {
    DOM: O.of(div([getDondeInstruction()]))
  }
}

function getCuandoInstruction() {
  return `Set the event time or recurrence`
}
function CuandoInstruction() {
  return {
    DOM: O.of(div([getCuandoInstruction()]))
  }
}

function getPropertiesInstruction() {
  return `Set the listing properties`
}

function PropertiesInstruction() {
  return {
    DOM: O.of(div([getPropertiesInstruction()]))
  }
}

function getPreviewInstruction() {
  return `Confirm all the information or go back and update`
}

function PreviewInstruction() {
  return {
    DOM: O.of(div([getPreviewInstruction()]))
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
    }).publish().refCount()

  const to_render$ = push_state$.filter(should_render)
    .pluck(`data`)

  const component$ = to_render$
    .map(push_state => {
      //console.log(`push_state`, push_state)
      const {current_step} = push_state 
      if (current_step) {
        //console.log(`routing to step: `, current_step)
        switch (current_step) { 
          case "meta":
            return createMeta(sources, inputs)
          case "donde":
            return createDonde(sources, inputs)
          case "cuando":
            return createCuando(sources, inputs)
          case "properties":
            return createProperties(sources, inputs)
          case "preview":
            return createPreview(sources, inputs)
          default:
            throw new Error(`Invalid current step given: ${current_step}`)
        }
      } else {
        return createDonde(sources, inputs)
      }
    })
    .map(x => {
      return {
        ...x,
        content: normalizeComponent(x.content)
      }
    })
    //.do(x => console.log(`component$...`, x))
    .publishReplay(1).refCount()



  const components = {
    content: component$.switchMap(component => component.content.DOM),
    buttons: component$.switchMap(component => component.buttons.DOM),
    instruction: component$.switchMap(component => {
      if (component.instruction) {
        return component.instruction.DOM
      } else {
        return O.of(undefined)
      }
    }),
    small_instruction: component$.switchMap(component => {
      if (component.small_instruction) {
        return component.small_instruction.DOM
      } else {
        return O.of(undefined)
      }
    })
  }

  const navigation$ = component$.switchMap(x => x.buttons.navigation$)
  const session$ = component$.switchMap(x => {
    return x.content.output$.pluck(`session`)
  })

  const saving$ = createProxy()

  const state$ = model(actions, {...inputs, session$, saving$})
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
    }).publish().refCount()

  const to_save_exit$ = actions.save_exit$.withLatestFrom(state$, (_, state) => {
    return {
      url: `/api/user`,
      method: `post`,
      category: `saveExitSession`,
      send: {
        route: `/listing_session/save`,
        data: state.session
      }
    }
  }).publish().refCount()

  const to_save$ = state$.pluck('session')
    .filter(x => !!x)
    .map(x => {
      return x
    })
    .distinctUntilChanged((x, y) => {
      return deepEqual(x, y)
    })
    .map(x => {
      return x
    })
    .debounceTime(5000)
    .withLatestFrom(state$, (_, state: any) => {
      return {
        url: `/api/user`,
        method: `post`,
        category: `saveSession`,
        send: {
          route: `/listing_session/save`,
          data: state.session
        }
      }
    }).publish().refCount()

  const save$ = O.merge(
    to_save_exit$      
      .map(x => {
        return x
      }), 
    to_save$
      .map(x => {
        return x
      })
  ).publish().refCount()

  saving$.attach(save$)

  const out = {
     DOM: vtree$,
     Global: component$.switchMap(x => x.content.Global),
     MapJSON: component$
      .switchMap(x => x.content.MapJSON)
      .publish().refCount(),
     HTTP: O.merge(
       to_retrieve$, 
       to_new$,
       save$,
       component$.switchMap(x => x.content.HTTP)
     ).publish().refCount(),
      //.do(x => console.log(`to http`, x)),
     Router: O.merge(
       component$.switchMap(x => x.content.Router),
       actions.brand_button$.mapTo('/'), 
       actions.success_save_exit$
         .delay(4)
         .map(val => {
           return {
             pathname: `/home/listings`,
             action: 'REPLACE',
             type: 'replace'
           }
         }),
       navigation$.withLatestFrom(state$, (nav, state) => {
         const session = deflateSession(state.session)
         return {
           pathname: `/create/listing`,
           type: `push`,
           state: {
             type: 'session',
             data: {...session, current_step: nav}
           }
         }
       }),
       O.merge(
         O.merge(
           actions.success_retrieve$,
           actions.success_create$
             .map(val => {
               return {
                 ...val, 
                 listing: {}, 
                 properties: {}, 
                 current_step: `meta`
               }
             })
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
         push_state$.filter(is_invalid)
           .map(x => {
             return {
               pathname: `/create`,
               type: 'replace',
               action: `REPLACE`,
             }
           })
       )
     ),//.do(x => console.log(`to router`, x)),
     MessageBus: O.merge(
       actions.show_menu$.mapTo({to: `main`, message: {type: `showLeftMenu`, data: {redirect_url: '/create/listing'}}}), 
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
       actions.success_save_exit$
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

  //out.MapJSON.subscribe(x => console.log(`MapJSON`, x))

  return out
}

export {
  main
}