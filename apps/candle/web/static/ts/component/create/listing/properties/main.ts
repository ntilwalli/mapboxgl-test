import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
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
import {MetaPropertyTypes, PerformerSignupOptions,getSessionStream, EventTypeToProperties, CostOptions} from '../helpers'
import {NotesInput} from './helpers'
import {combineObj, createProxy, traceStartStop} from '../../../../utils'
import clone = require('clone')
import deepEqual = require('deep-equal')

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

function toComponent(type, meta, session$, sources, inputs, authorization) {
  let component

  switch (type) {
    case MetaPropertyTypes.PERFORMER_SIGN_UP:
      component = PerformerSignup
      break
    case MetaPropertyTypes.PERFORMER_CHECK_IN:
      component = PerformerCheckIn
      break
    case MetaPropertyTypes.PERFORMER_COST:
      component = (sources, inputs) => CostCollection(sources, {
        ...inputs, 
        component_id: 'Performer cost', 
        item_heading: 'Tier',
      })
      break
    case MetaPropertyTypes.STAGE_TIME:
      component = (sources, inputs) => isolate(CollapseCollection)(sources, {
        ...inputs, 
        item: StageTimeRound, 
        component_id: 'Stage time', 
        item_heading: 'Round', 
        itemDefault: getStageTimeDefault
      })
      break
    case MetaPropertyTypes.PERFORMER_LIMIT:
      component = PerformerLimit
      break
    case MetaPropertyTypes.LISTED_HOSTS:
      component = (sources, inputs) => isolate(Collection)(sources, {
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
      })
      break
    case MetaPropertyTypes.NOTES:
      component = NotesInput
      break;
    case MetaPropertyTypes.LISTED_PERFORMERS:
      component = (sources, inputs) => isolate(Collection)(sources, {
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
      })
      break
    case MetaPropertyTypes.AUDIENCE_COST:
      const options = [
        CostOptions.FREE,
        CostOptions.COVER,
        CostOptions.MINIMUM_PURCHASE,
        CostOptions.COVER_AND_MINIMUM_PURCHASE
      ]
      
      component = (sources, inputs) => isolate(Cost)(sources, {...inputs, options, heading_text: 'Audience cost'})
      break
    case MetaPropertyTypes.CONTACT_INFO:
      component = ContactInfo
      break
    default:
      throw new Error(`Invalid property component type: ${type}`)
  }

  return wrapOutput(component, type, meta, session$, sources, inputs)
}

function intent(sources) {
  return {
    session$: getSessionStream(sources)
      .publishReplay(1).refCount()
  }
}

function reducers(actions, inputs) {
  const properties_output_r = inputs.properties$.map(message => state => {
    //console.log(`properties message`, message)
    const properties = state.get(`properties`)
    properties[message.type] = message.data
    const session = state.get(`session`)
    session.listing.meta[message.type] = message.data.data

    return state.set('properties', properties)
      .set(`session`, session)
      .set('component_types', calculateComponentTypes(session))
  })

  return O.merge(properties_output_r)
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
    session$: actions.session$.take(1),
    authorization$: inputs.Authorization.status$
  })
    .switchMap((info: any) => {
      const init = {
        authorization: info.authorization,
        session: info.session,
        component_types: calculateComponentTypes(info.session),
        properties: {}
      }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => clone(x.toJS()))
    .debounceTime(0)  // ensure all valid flags have been collected before calculating validity
    .map((state: any) => {
      return {
        ...state,
        valid: Object.keys(state.properties).every(prop => state.properties[prop].valid)
      }
    })
    //.do(x => console.log('properties state', x))
    //.letBind(traceStartStop('state$ trace'))
    .publishReplay(1).refCount()
}

function view(state$, children$) {
  return combineObj({
    state$,
    children$
  }).map((info: any) => {
    const {state, children} = info
    const {properties} = state
    const errors = 
      Object.keys(properties).reduce((acc, val) => acc.concat(properties[val].errors), [])

    return div(`.workflow-step`, [
      errors.length ? div('.errors', errors.map(x => div([x]))) : null,
      div(`.body`, children.map(x => div(`.large-margin-bottom`, [x])))
    ])
  })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const properties$ = createProxy()
  const state$ = model(actions, {...inputs, properties$})
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

      return {
        DOM, output$
      }
    })
    .publishReplay(1).refCount()
  
  properties$.attach(components$.switchMap(x => x.output$))
  const properties_dom$ = components$.switchMap(x => x.DOM)

  return {
    DOM: view(state$, properties_dom$),
    output$: state$
  }
}