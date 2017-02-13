import {Observable as O} from 'rxjs'
import {div, h6, button, span} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import PerformerSignup from './performerSignUp/main'
import ParticipantSignup from './participantSignUp/main'
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
import {getSessionStream, isExpired, renderExpiredAlert, isUpdateDisabled, renderDisabledAlert} from '../../../helpers/listing/utils'
import {NotesInput} from './helpers'
import {combineObj, createProxy, traceStartStop, componentify, mergeSinks, targetIsOwner, processHTTP, toMessageBusMainError} from '../../../../utils'
import clone = require('clone')
import deepEqual = require('deep-equal')

import UpdateListingQuery from '../../../../query/updateListing'

import FocusWrapper from '../focusWrapperWithInstruction'

const default_instruction = 'Click on a section to see tips'

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

function intent(sources) {
  const {DOM, Global, Router} = sources

  const main_panel_click$ = DOM.select('.appMainPanel').events('click').filter(targetIsOwner)
    .mapTo(default_instruction)

  const save$ = DOM.select('.appSaveButton').events('click').publish().refCount()

  return {
    main_panel_click$,
    save$
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
          CostCollection(sources, {
            ...inputs, 
            component_id: 'Performer cost', 
            item_heading: 'Tier',
          }),
          undefined,
          instruction
        )
      }
      break
    case MetaPropertyTypes.PARTICIPANT_COST:
      component = (sources, inputs) => {
        const options = [
          CostOptions.FREE,
          CostOptions.COVER,
          CostOptions.MINIMUM_PURCHASE,
          CostOptions.COVER_AND_MINIMUM_PURCHASE
        ]

        const component = isolate(Cost)(sources, {...inputs, options})
        const instruction = "Cost to attend per participant/team"
        const out = wrapWithFocus(sources, component, 'Participation cost', instruction)
        return out
      }

      break
    case MetaPropertyTypes.PARTICIPANT_LIMIT:
      component = (sources, inputs) => {
        const instruction = "Set the number of participant slots available for the event"
        return wrapWithFocus(sources, PerformerLimit(sources, inputs), 'Participant limit', instruction)
      }
      break
    case MetaPropertyTypes.PARTICIPANT_SIGN_UP:
      component = (sources, inputs) => {
        const instruction = "Configure how/when participants can sign-up for the event"
        return wrapWithFocus(sources, ParticipantSignup(sources, inputs), 'Participant sign-up', instruction)
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
            initDefault: authorization ? () => ({
              data: authorization.name,
              valid: true,
              errors: []
            }) : undefined
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
          undefined,
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
  const save_success_r = inputs.success$.map(status => state => {
    return state.set('save_status', status).set('waiting', false)
  })

  const waiting_r = inputs.waiting$.map(_ => state => state.set('waiting', true))

  const properties_r = inputs.properties$.map(message => state => {
    //console.log(`properties message`, message)
    let  properties = state.get(`properties`).toJS()
    properties[message.type] = message.data
    const session = state.get(`session`).toJS()
    session.listing.meta[message.type] = message.data.data
    const errors = Object.keys(properties).reduce((acc, val) => acc.concat(properties[val].errors), [])
    return state.set('properties', Immutable.fromJS(properties))
      .set(`session`, Immutable.fromJS(session))
      .set('component_types', Immutable.fromJS(calculateComponentTypes(session)))
      .set('errors', errors)
      .set('valid', errors.length === 0)
  })

  return O.merge(properties_r, save_success_r, waiting_r)
}

function calculateComponentTypes(session) {
  const {listing} = session
  const {meta} = listing
  const {event_types, performer_cost} = meta
  const foo_components = event_types.reduce((acc, val) => acc.concat(EventTypeToProperties[val]), [])
  let out = arrayUnique(foo_components)


  // if (out.indexOf('stage_time') > -1 &&
  //     performer_cost && 
  //     performer_cost.length > 1) {
  //   const index = out.findIndex(x => x === 'stage_time')
  //   out.splice(index, 1)
  //   listing.meta.stage_time = undefined
  // }

  return out
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    session$: inputs.session$.take(1),
    authorization$: inputs.Authorization.status$
  })
    .switchMap((info: any) => {
      const init = {
        session: info.session,
        component_types: calculateComponentTypes(info.session),
        properties: {},
        errors: [],
        valid: false,
        waiting: false,
        save_status: undefined
      }

      return reducer$
        .startWith(Immutable.fromJS(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => {
      return x.toJS()
    })
    .debounceTime(0)  // ensure all valid flags have been collected before calculating validity
    //.do(x => console.log('properties state', x))
    //.letBind(traceStartStop('state$ trace'))
    .publishReplay(1).refCount()
}

function renderSaveButton(info) {
  const is_update_disabled = isUpdateDisabled(info.state.session)
  return button('.appSaveButton.mt-4.btn.btn-outline-success.d-flex.cursor-pointer.mt-4', {class: {"read-only": is_update_disabled || !info.state.valid}}, [
    span('.d-flex.align-items-center', ['Save changes']),
  ])
}


function view(state$, children$) {
  return combineObj({
    state$,
    children$
  })
  .debounceTime(0)
  .map((info: any) => {
    const {state, children} = info
    const {properties, errors} = state
    const display_errors = 
      errors
        .map(x => div('.form-group', [
          div('.alerts-area', [
            div('.alert.alert-danger', [
              x
            ])
          ])
        ]))

    const is_update_disabled = isUpdateDisabled(state.session)


    // return div('.properties', [
    //   ...display_errors,
    //   div('.mt-4', children.map(x => div({style: {"margin-bottom": "2rem"}}, [x])))
    // ])

    return div('.properties', [
      ...display_errors,
      renderDisabledAlert(state.session),
      div('.pt-4', {class: {"read-only": is_update_disabled}}, children.map(x => div({style: {"margin-bottom": "3rem"}}, [x]))),
      renderSaveButton(info)
    ])
  })
}

function muxHTTP(sources) {
  return processHTTP(sources, 'updateListing')
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const properties$ = createProxy()

  const waiting$ = createProxy()
  const success$ = createProxy()

  const state$ = model(actions, {...inputs, properties$, waiting$, success$})

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
      const output$ = O.merge(...components.map(c => c.output$))
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
  
  const components = componentify(components$)
  properties$.attach(components$.switchMap(x => x.output$))
  const properties_dom$ = components.DOM

  const save_attempt$ = actions.save$
    .withLatestFrom(state$, (_, state: any) => {
      return state
    })
    .filter((state: any) => state.valid)
    .map((state: any) => state.session.listing)
    .publish().refCount()

  const update_listing_query= UpdateListingQuery(sources, {props$: save_attempt$})

  waiting$.attach(update_listing_query.waiting$)
  success$.attach(update_listing_query.success$)

  const merged = mergeSinks(components, update_listing_query)

  return {
    ...merged,
    DOM: view(state$, properties_dom$),
    MessageBus: O.merge(
      merged.MessageBus,
      update_listing_query.error$.map(toMessageBusMainError)
    ),
    output$: state$.map((state: any) => {
      return {
        valid: state.valid,
        session: state.session
      }
    }),
    instruction_focus$: O.merge(components$.switchMap(x => x.focus$), actions.main_panel_click$.mapTo(default_instruction).startWith(default_instruction))
  }
}