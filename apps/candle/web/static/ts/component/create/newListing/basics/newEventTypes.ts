import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../utils'
import {
  EventTypes, 
  EventTypeToProperties, 
  EventTypeComboOptions, 
  arrayToEventTypeComboOption, 
  eventTypeComboOptionToArray
} from '../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has, metaPropertyToDefaultFunction} from '../../../helpers/listing/utils'
import ComboBox from '../../../../library/comboBox'


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

  const options = Object.keys(EventTypeComboOptions).map(x => EventTypeComboOptions[x])
  const props$ = inputs.session$
    .map(session => session.listing.meta.event_types)
    .map(arrayToEventTypeComboOption)

  const event_type = isolate(ComboBox)(sources, options, props$)

  return {
    DOM: event_type.DOM,
    output$: event_type.output$.map(event_types => {
      return {
        data: eventTypeComboOptionToArray(event_types),
        apply: applyChange,
        valid: true,
        errors: []
      }
    }).publishReplay(1).refCount()
  }
}