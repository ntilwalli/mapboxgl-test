import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import Immutable = require('immutable')
import PerformerSignup from './performerSignup/main'
import {getSessionStream} from '../helpers'
import {combineObj} from '../../../../utils'

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
  'open-mic': ['performer_signup'],
  'show': []
}

function wrapOutput(component, component_type, meta, sources, inputs) {
  const prop = meta[component_type]
  const c = component(sources, {...inputs, props$: O.of(prop)})
  return {
    ...c,
    output$: c.output$.map(out => ({
      type: component_type,
      data: out
    }))
  }
}

function toComponent(type, meta, sources, inputs) {
  let component

  switch (type) {
    case 'performer_signup':
      component = PerformerSignup
      break
    default:
      throw new Error(`Invalid property component type: ${type}`)
  }

  return wrapOutput(component, type, meta, sources, inputs)
}

function intent(sources) {
  return {
    session$: getSessionStream(sources)
      .publishReplay(1).refCount()
  }
}

function reducers(actions, inputs) {
  const properties_output_r = inputs.properties_output$.map(message => state => {
    console.log(`properties message`, message)
    return state.update('session', session => {
        session.listing.meta[message.type] = message.data.prop
        return session
      }).update(`valid_flags`, valid_flags => {
        valid_flags[message.type] = message.data.valid
        return valid_flags
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
        valid_flags: new Object()
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
    //.do(x => console.log('properties state', x))
    .publishReplay(1).refCount()
}

function view(children$) {
  return children$.map(children => {
    return div(`.workflow-step`, [
      div(`.body`, children)
    ])
  })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const property_components$ = actions.session$
    .map(session => {
      const {listing} = session
      const {event_types, meta} = listing

      const foo_components = event_types.reduce((acc, val) => acc.concat(event_type_to_properties[val]), [])
      const component_types = arrayUnique(foo_components)
      const components = component_types.map(x => toComponent(x, meta, sources, inputs))
      //console.log('component',components)
      const DOM = O.combineLatest(...components.map(x => x.DOM))
      
      const output$ = O.merge(...components.map(x => x.output$))

      return {
        DOM, output$
      }
    })
    .publishReplay(1).refCount()
  
  const properties_output$ = property_components$.switchMap(x => x.output$)
  const state$ = model(actions, {...inputs, properties_output$})
  const properties_dom$ = property_components$.switchMap(x => x.DOM)
  return {
    DOM: view(properties_dom$),
    output$: state$
  }
}