import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import Immutable = require('immutable')
import PerformerSignup from './performerSignup/main'
import CheckIn from './checkin/main'
import PerformerCost from './performerCost/main'
import {getSessionStream} from '../helpers'
import {combineObj, createProxy} from '../../../../utils'

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


const event_type_to_properties = {
  'open-mic': ['check_in', 'performer_signup', 'performer_cost'],
  'show': ['check_in']
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

function toComponent(type, meta, session$, sources, inputs) {
  let component

  switch (type) {
    case 'performer_signup':
      component = PerformerSignup
      break
    case 'check_in':
      component = CheckIn
      break
    case 'performer_cost':
      component = PerformerCost
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
    return state.update('session', session => {
        session.listing.meta[message.type] = message.data.prop
        return session
      }).update(`valid_flags`, valid_flags => {
        valid_flags[message.type] = message.data.valid
        return valid_flags
      }).update('errors_map', errors_map => {
        errors_map[message.type] = message.data.errors
        return errors_map
      })
  })

  return O.merge(properties_output_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    session$: actions.session$,
    //authorization$: inputs.Authorization.status$
  })
    .switchMap((info: any) => {
      const init = {
        session: info.session,
        valid_flags: {},
        errors_map: {}
        //authorization: info.authorization,
      }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .debounceTime(0)  // ensure all valid flags have been collected before calculating validity
    .map((x: any) => {
      return {
        ...x,
        valid: Object.keys(x.valid_flags).every(prop => x.valid_flags[prop])
      }
    })
    .do(x => console.log('properties state', x))
    .publishReplay(1).refCount()
}

function view(state$, children$) {
  return combineObj({
    state$,
    children$
  }).map((info: any) => {
    const {state, children} = info
    const {errors_map} = state
    const errors = 
      Object.keys(errors_map).reduce((acc, val) => acc.concat(errors_map[val]), [])

    return div(`.workflow-step`, [
      errors.length ? div('.errors', errors.map(x => div([x]))) : null,
      div(`.body`, children.map(x => div(`.large-margin-bottom`, [x])))
    ])
  })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const session$ = createProxy()
  const property_components$ = actions.session$
    .map(session => {
      const {listing} = session
      const {event_types, meta} = listing

      const foo_components = event_types.reduce((acc, val) => acc.concat(event_type_to_properties[val]), [])
      const component_types = arrayUnique(foo_components)
      const components = component_types.map(type => toComponent(type, meta, session$, sources, inputs))
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
  return {
    DOM: view(state$, properties_dom$),
    output$: state$
  }
}