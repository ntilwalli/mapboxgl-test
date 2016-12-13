import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import PerformerSignup from './performerSignup/main'
import CheckIn from './checkin/main'
import Cost from './cost/main'
import CollapseCollection from './collapseCollection/main'
import Collection from './collection/main'
import CostCollection from './costCollection/main'
import StageTimeRound from './stageTimeRound/main'
import PerformerLimit from './performerLimit/main'
import PersonName from './personName/main'
import PersonNameTitle from './personNameTitle/main'
import ContactInfo from './contactInfo/main'
import {MetaPropertyTypes, getSessionStream, EventTypeToProperties, CostOptions} from '../helpers'
import {NotesInput} from './helpers'
import {combineObj, createProxy, traceStartStop} from '../../../../utils'
import {getDefault as getStageTimeDefault} from './stageTimeRound/main'

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
    case MetaPropertyTypes.CHECK_IN:
      component = CheckIn
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
  const properties_output_r = inputs.properties_output$.map(message => state => {
    //console.log(`properties message`, message)
    const properties = state.get(`properties`)
    properties[message.type] = message.data
    const session = state.get(`session`)
    session.listing.meta[message.type] = message.data.data

    return state.set('properties', properties)
      .set(`session`, session)

    // return state.update('session', session => {
    //     session.listing.meta[message.type] = message.data.data
    //     return session
    //   }).update(`valid_flags`, valid_flags => {
    //     valid_flags[message.type] = message.data.valid
    //     return valid_flags
    //   }).update('errors_map', errors_map => {
    //     errors_map[message.type] = message.data.errors
    //     return errors_map
    //   })
  })

  return O.merge(properties_output_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    session$: actions.session$,
    authorization$: inputs.Authorization.status$
  })
    .switchMap((info: any) => {
      const init = {
        session: info.session,
        properties: {}
      }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .debounceTime(0)  // ensure all valid flags have been collected before calculating validity
    .map((state: any) => {
      return {
        ...state,
        valid: Object.keys(state.properties).every(prop => state.properties[prop].valid)
      }
    })
    //.do(x => console.log('properties state', x))
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
  const session$ = createProxy()
  const replay_session$ = session$
    //.letBind(traceStartStop('replay_session trace'))
    .publishReplay(1).refCount()
  const shunted_session$ = replay_session$
    .filter(x => false)
  const property_components$ = combineObj({
      session: O.merge(actions.session$, shunted_session$), //  create permanent subscriber to circular session so session can be fed back to components
      authorization: inputs.Authorization.status$
    })
    .map((info: any) => {
      const {session, authorization} = info
      const {listing} = session
      const {meta} = listing
      const {event_types} = meta

      const foo_components = event_types.reduce((acc, val) => acc.concat(EventTypeToProperties[val]), [])
      const component_types = arrayUnique(foo_components)
      const components = component_types.map(type => {
        return toComponent(type, meta, replay_session$, sources, inputs, authorization)
      })
      //console.log('component',components)
      const DOM = O.combineLatest(...components.map(c => c.DOM))
      
      const output$ = O.merge(...components.map(c => c.output$))

      return {
        DOM, output$
      }
    })
    .publishReplay(1).refCount()
  
  const properties_output$ = property_components$.switchMap(x => x.output$)
  const state$ = model(actions, {...inputs, properties_output$})
  const properties_dom$ = property_components$.switchMap(x => x.DOM)

  session$.attach(state$.pluck('session'))

  return {
    DOM: view(state$, properties_dom$),
    output$: state$
  }
}