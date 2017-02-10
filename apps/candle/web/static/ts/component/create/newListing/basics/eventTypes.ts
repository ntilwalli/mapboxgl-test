import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../utils'
import {EventTypes, EventTypeToProperties} from '../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has, metaPropertyToDefaultFunction} from '../../../helpers/listing/utils'

const always_properties = ['name', 'event_types', 'categories', 'description', 'type']
function applyChange(session, val) {
  session.listing.meta.event_types = val

  const expected_properties = {} 
  session.listing.meta.event_types
    .map(x => EventTypeToProperties[x])
    .reduce((acc, val) => acc.concat(val), [])
    .concat(always_properties)
    .forEach(x => expected_properties[x] = true)

  const all_properties = {}
  Object.keys(EventTypes)
    .map(x => {
      const out = EventTypeToProperties[x.toLowerCase()]
      return out
    })
    .reduce((acc, val) => {
      const out = acc.concat(val)
      return out
    }, [])
    .concat(always_properties)
    .forEach(x => all_properties[x] = expected_properties[x] ? true : false)

  const merged_properties = {}
  Object.keys(all_properties)
    .forEach(x => {
      if (all_properties[x]) {
        if (session.listing.meta[x]) {
          merged_properties[x] = session.listing.meta[x]
        } else {
          merged_properties[x] = metaPropertyToDefaultFunction[x]()
        }
      } else {
        if (session.listing.meta[x]) {
          delete session.listing.meta[x]
        }
      }
    })

  session.listing.meta = merged_properties
}

export default function main(sources, inputs) {

  const reducer$ = sources.DOM.select('.appEventTypeInput').events('click')
    .map(fromCheckbox)
    .map(msg => state => {
      return state.update('event_types', (event_types: any) => {
        //console.log(`category`, val)
        const new_event_types = event_types.toJS()
        const out = processCheckboxArray(msg, new_event_types)
        return Immutable.fromJS(out)
      })
    })

  const event_types$ = inputs.session$
    .map((session: any) => {
      return session.listing.meta.event_types
    })
    .switchMap(event_types => {
      return reducer$.startWith(Immutable.fromJS({event_types})).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS().event_types)
    .publishReplay(1).refCount()


  const vtree$ = event_types$
    .map(event_types => {
      const disable_open_mic = has(event_types, EventTypes.OPEN_MIC) && event_types.length === 1
      const disable_show = has(event_types, EventTypes.SHOW) && event_types.length === 1
      return div([
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appEventTypeInput.form-check-input`, {attrs: {disabled: disable_open_mic, type: 'checkbox', name: 'eventTypes', value: EventTypes.OPEN_MIC, checked: has(event_types, EventTypes.OPEN_MIC)}}, []),
            span('.ml-xs', ['open-mic'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appEventTypeInput.form-check-input`, {attrs: {disabled: disable_show, type: 'checkbox', name: 'eventTypes', value: EventTypes.SHOW, checked: has(event_types, EventTypes.SHOW)}}, []),
            span('.ml-xs', ['show'])
          ])
        ])
      ])
    })

  return {
    DOM: vtree$,
    output$: event_types$.map(event_types => {
      return {
        data: event_types,
        apply: applyChange,
        valid: true,
        errors: []
      }
    }).publishReplay(1).refCount()
  }
}