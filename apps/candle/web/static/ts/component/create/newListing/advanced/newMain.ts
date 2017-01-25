import {Observable as O} from 'rxjs'
import {div, h6, button, span} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import PerformerSignup from './performerSignUp/main'
//import PerformerCheckIn from './performerCheckIn/main'
import PerformerCheckIn from './togglePerformerCheckIn/main'
import Cost from './cost/main'
import CollapseCollection from './collapseCollection/main'
import Collection from './collection/main'
import CostCollection from './costCollection/main'
import PerformerLimit from './performerLimit/main'
import PersonName from './personName/main'
import PersonNameTitle from './personNameTitle/main'
import ContactInfo from './contactInfo/main'
import {default as StageTimeRound, getDefault as getStageTimeDefault} from './stageTimeRound/main'
import {
  MetaPropertyTypes, 
  PerformerSignupOptions, 
  EventTypeToProperties, 
  CostOptions
} from '../../../../listingTypes'
import {getSessionStream, deflateSession} from '../../../helpers/listing/utils'
import {NotesInput} from './helpers'
import {combineObj, createProxy, traceStartStop, componentify, mergeSinks, targetIsOwner, processHTTP} from '../../../../utils'
import clone = require('clone')
import deepEqual = require('deep-equal')

import FocusWrapper from '../focusWrapperWithInstruction'

const default_instruction = 'Click on a section to see tips'
function intent(sources) {
  const {DOM, Global, Router} = sources
  const session$ = getSessionStream(sources)
    .publishReplay(1).refCount()
  
  const open_instruction$ = DOM.select('.appOpenInstruction').events(`click`)
  const close_instruction$ = O.merge(
    Global.resize$,
    DOM.select('.appCloseInstruction').events(`click`)
  )

  const main_panel_click$ = DOM.select('.appMainPanel').events('click').filter(targetIsOwner)
    .mapTo(default_instruction)
  const go_to_preview$ = DOM.select('.appGoToPreviewButton').events('click').publish().refCount()
  const go_to_basics$ = DOM.select('.appGoToBasicsButton').events('click').publish().refCount()
  const save_exit$ = DOM.select('.appSaveExitButton').events('click').publish().refCount()

  const saved_exit = processHTTP(sources, `saveExitSession`)
  const success_save_exit$ = saved_exit.success$
  const error_save_exit$ = saved_exit.error$

  return {
    session$,
    open_instruction$,
    close_instruction$,
    main_panel_click$,
    go_to_preview$,
    go_to_basics$,
    show_errors$: O.merge(go_to_preview$, go_to_basics$).mapTo(true).startWith(false).publishReplay(1).refCount(),
    save_exit$,
    success_save_exit$,
    error_save_exit$
  }
}

function wrapOutput(component, component_type, meta, session$, sources, inputs) {
  const c = component(sources, {...inputs, props$: O.of(meta[component_type]), session$})
  return {
    ...c,
    output$: c.output$.map(out => ({
      type: component_type,
      data: out
    }))
  }
}

function wrapWithFocus(sources, component, title, instruction) {
  return isolate(FocusWrapper)(sources, {component, title, instruction})
}

function toComponent(type, meta, session$, sources, inputs, authorization) {
  let component, instruction

  switch (type) {
    case MetaPropertyTypes.PERFORMER_SIGN_UP:
      component = (sources, inputs) => {
        const instruction = "Configure how/when performers can sign-up for the open-mic"
        return wrapWithFocus(sources, PerformerSignup(sources, inputs), 'Performer sign-up', instruction)
      }
      break
    case MetaPropertyTypes.PERFORMER_CHECK_IN:
      component = (sources, inputs) => {
        const instruction = "Configure how/when pre-registered performers can check-in to the open-mic."
        return wrapWithFocus(sources, PerformerCheckIn(sources, inputs), 'Performer check-in', instruction)
      }
      break
    case MetaPropertyTypes.PERFORMER_COST:
      component = (sources, inputs) => {
        const instruction = "Configure the performer cost. Enable multiple cost-tiers by clicking the plus button."
        return wrapWithFocus(
          sources, 
          isolate(CostCollection)(sources, {
            ...inputs, 
            component_id: 'Performer cost', 
            item_heading: 'Tier',
          }),
          undefined,
          instruction
        )
      }
      break
    case MetaPropertyTypes.STAGE_TIME:
      component = (sources, inputs) => {
        const instruction = 'Set the amount of stage time performers get. Enable mulitiple rounds by clicking the plus sign.'
        return wrapWithFocus(sources, isolate(CollapseCollection)(sources, {
            ...inputs, 
            item: StageTimeRound, 
            component_id: 'Stage time', 
            item_heading: 'Round', 
            itemDefault: getStageTimeDefault
          }),
          undefined,
          instruction
        )
      }
      break
    case MetaPropertyTypes.PERFORMER_LIMIT:
      component = (sources, inputs) => {
        const instruction = "Set the number of performer slots available on the mic"
        return wrapWithFocus(sources, PerformerLimit(sources, inputs), 'Performer limit', instruction)
      }
      break
    case MetaPropertyTypes.LISTED_HOSTS:
      component = (sources, inputs) => {
        const instruction = "List the hosts for this show"
        return wrapWithFocus(
          sources,
          isolate(Collection)(sources, {
            ...inputs, 
            item: PersonName, 
            item_heading: 'host',
            component_id: 'Hosts', 
            itemDefault: () => ({
              data: '',
              valid: true,
              errors: []
            }),
            initDefault: () => ({
              data: authorization.name,
              valid: true,
              errors: []
            })
          }), 
          undefined, 
          instruction
        )
      }
      break
    case MetaPropertyTypes.NOTES:
      component = (sources, inputs) => {
        const instruction = "Notes for this listing"
        return wrapWithFocus(sources, NotesInput(sources, inputs), 'Note', instruction)
      }
      break;
    case MetaPropertyTypes.LISTED_PERFORMERS:
      component = (sources, inputs) => {
        const instruction = "List the performers for this show"
        return wrapWithFocus(
          sources,
          isolate(Collection)(sources, {
            ...inputs, 
            initEmpty: true,
            item_heading: 'performer',
            item: PersonNameTitle, 
            component_id: 'Performers', 
            itemDefault: () => ({
              data: {
                name: '',
                title: ''
              },
              valid: true,
              errors: []
            })
          }),
          'Listed performers',
          instruction
        )
      }
      break
    case MetaPropertyTypes.AUDIENCE_COST:
      component = (sources, inputs) => {
        const options = [
          CostOptions.FREE,
          CostOptions.COVER,
          CostOptions.MINIMUM_PURCHASE,
          CostOptions.COVER_AND_MINIMUM_PURCHASE
        ]

        const component = isolate(Cost)(sources, {...inputs, options})
        const instruction = "Cost to attend show"
        const out = wrapWithFocus(sources, component, 'Audience cost', instruction)
        return out
      }

      break
    case MetaPropertyTypes.CONTACT_INFO:
      component = (sources, inputs) => {
        const instruction = "Contact information for this listing"
        return wrapWithFocus(sources, ContactInfo(sources, inputs), 'Contact info', instruction)
      }
      break
    default:
      throw new Error(`Invalid property component type: ${type}`)
  }

  return wrapOutput(component, type, meta, session$, sources, inputs)
}



function reducers(actions, inputs) {

  const open_instruction_r = actions.open_instruction$.map(_ => state => {
    return state.set('show_instruction', true)
  })

  const close_instruction_r = actions.close_instruction$.map(_ => state => {
    return state.set('show_instruction', false)
  })

  const properties_r = inputs.properties$.map(properties => state => {
    const session = state.get(`session`).toJS()
    properties.forEach(p => session.listing.meta[p.type] = p.data.data)
    const errors = properties.reduce((acc, val) => acc.concat(val.data.errors), [])

    return state.set('properties', Immutable.fromJS(properties))
      .set(`session`, Immutable.fromJS(session))
      .set('component_types', Immutable.fromJS(calculateComponentTypes(session)))
      .set('errors', Immutable.fromJS(errors))
      .set('valid', errors.length === 0)
  })

  const instruction_r = O.merge(inputs.instruction_focus$, actions.main_panel_click$)
    .map(x => state => {
      return state.set('focus_instruction', x)
    })

  // const main_panel_click_r = actions.main_panel_click$.map(_ => state => {
  //   return state.set('focus', undefined)
  // })

  const show_errors_r = actions.show_errors$.map(val => state => {
    return state.set('show_errors', val)
  })

  return O.merge(properties_r, instruction_r, open_instruction_r, close_instruction_r, show_errors_r)
}

function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

function calculateComponentTypes(session) {
  const {listing} = session
  const {meta} = listing
  const {event_types, performer_cost} = meta
  const foo_components = event_types.reduce((acc, val) => acc.concat(EventTypeToProperties[val]), [])
  let out = arrayUnique(foo_components)
  return out
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$,
      authorization$: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      //console.log('meta init', info)
      
      const session = info.session
      const init = {
        focus_instruction: default_instruction,
        show_instruction: false,
        authorization: info.authorization,
        waiting: false,
        errors: [],
        show_errors: false,
        session,
        valid: false,
        component_types: calculateComponentTypes(session),
        properties: {}
      }

      return reducer$
        .startWith(Immutable.fromJS(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`meta state`, x))
    .publishReplay(1).refCount()
}

function renderMainPanel(info: any) {
  const {state, components} = info
  const {show_errors, errors} = state
  return div(`.main-panel.container-fluid.mt-4`, [
      show_errors && errors.length ? div(`.form-group`, [
        div(`.alerts-area`, errors.map(e => {
            return div(`.alert.alert-danger`, [
              e
            ])
        }))
      ]) : null,
    ]
    .concat(components.map((x, index) => index ? div('.mt-4', [x]) : x))
    .concat([
      div('.appGoToBasicsButton.mt-4.btn.btn-link.cursor-pointer.d-flex', {style: {"flex-flow": "row nowrap", flex: "0 0 fixed"}}, [
        span('.fa.fa-angle-double-left.mr-2.d-flex.align-items-center', []),
        span('.d-flex.align-items-center', ['Back to basic settings'])
      ]),
      button('.appSaveExitButton.mt-4.btn.btn-outline-warning.d-flex.cursor-pointer.mt-4', [
        span('.d-flex.align-items-center', ['Save/Finish later']),
        span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
      ]),
      button('.appGoToPreviewButton.mt-4.btn.btn-outline-success.d-flex.cursor-pointer.mt-4', [
        span('.d-flex.align-items-center', ['Preview and post']),
        span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
      ])
    ])
  )
}

function renderInstructionPanel(info: any) {
  return div(`.instruction-panel`, [
    renderInstructionSubpanel(info)
  ])
}

function renderSmallInstructionPanel(info) {
  const {state, components} = info
  const {focus_instruction, show_instruction} = state
  return div('.small-instruction-panel', {
      class: {
        appOpenInstruction: !show_instruction,
        rounded: show_instruction,
        'rounded-circle': !show_instruction
        //hide: !show_instruction
      }
    }, [
      div([span(`.appCloseInstruction.close`, {style: {display: !!show_instruction ? 'inline' : 'none'}}, []),
      span(`.icon.fa.fa-lightbulb-o`)]),
      div({style: {display: !!show_instruction ? 'block' : 'none'}}, [focus_instruction || default_instruction])
    ])
}

function renderInstructionSubpanel(info) {
  const {state, components} = info
  const {instruction} = components
  return div(`.instruction-panel`, [
    div(`.instruction-section`, [
      div([
        span(`.icon.fa.fa-lightbulb-o`),
        state.focus_instruction || default_instruction
      ])
    ])
  ])
}

function view(state$, components$) {
  return combineObj({
    state$,
    components$
  }).map((info: any) => {
    const {state, components} = info
    const {show_instruction} = state
    const {name} = components

    return div(`.screen.create-component`, [
      div('.properties.content-section.nav-fixed-offset.appMainPanel',  {
        // hook: {
        //   create: (emptyVNode, {elm}) => {
        //     window.scrollTo(0, 0)
        //   },
        //   update: (old, {elm}) => {
        //     window.scrollTo(0, 0)
        //   }
        // }
      } ,[
        renderMainPanel(info),
        renderSmallInstructionPanel(info),
        renderInstructionPanel(info)
      ])
    ])
  })
}

const toName = (session) => session.listing.meta.name

export function main(sources, inputs) {
  const actions = intent(sources)
  const properties$ = createProxy()
  const instruction_focus$ = createProxy()
  const state$ = model(actions, {...inputs, properties$, instruction_focus$})

  const session$ = state$.pluck('session').publishReplay(1).refCount()
  const components$ = state$
    .distinctUntilChanged((x: any, y: any) => x.component_types.length === y.component_types.length)
    .map((state: any) => {
      const {authorization, session, component_types} = state
      const meta = session.listing.meta
      const components = component_types.map(type => {
        return toComponent(type, meta, session$.delay(4), sources, inputs, authorization)
      })

      const DOM = O.combineLatest(...components.map(c => c.DOM))
      const output$ = O.combineLatest(...components.map(c => c.output$))
      const focus$ = O.merge(...components.filter(c => c.focus$).map(c => c.focus$))

      const merged = mergeSinks(...components)

      return {
        ...merged,
        DOM, 
        output$,
        focus$
      }
    })
    .publishReplay(1).refCount()

  properties$.attach(components$.switchMap(x => x.output$))
  instruction_focus$.attach(components$.switchMap(x => x.focus$))

  const component = componentify(components$)
  const vtree$ = view(state$, component.DOM)

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

  return {
    ...component,
    DOM: vtree$,
    HTTP: O.merge(
      component.HTTP,
      to_save_exit$
    ),
    Router: O.merge(
      component.Router,
      actions.success_save_exit$.withLatestFrom(inputs.Authorization.status$, (_, user) => user)
        .map(user => {
          return {
            pathname: '/' + user.username + '/listings',
            action: 'REPLACE',
            type: 'replace'
          }
        }),
      actions.go_to_preview$.withLatestFrom(state$, (_, state) => {
          return state
        })
        .filter(state => state.valid)
        .map(state => {
          return {
            pathname: '/create/listing',
            type: 'push',
            state: {
              type: 'session',
              data: {
                ...deflateSession(state.session),
                current_step: 'preview'
              }
            }
          }
        }),
      state$.map((x: any) => x.session.properties.donde.modal).distinctUntilChanged()
        .withLatestFrom(state$, (_, state: any) => {
          return {
            pathname: '/create/listing',
            type: 'push',
            state: {
              type: 'session', 
              data: state.session
            }
          }
        }).skip(1),
      actions.go_to_basics$.withLatestFrom(state$, (_, state) => {
          return state
        })
        .filter(state => state.valid)
        .map(state => {
          return {
            pathname: '/create/listing',
            type: 'push',
            state: {
              type: 'session',
              data: {
                ...deflateSession(state.session),
                current_step: 'basics'
              }
            }
          }
        })
    )
  }
}
