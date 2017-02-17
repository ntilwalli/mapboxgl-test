import {Observable as O} from 'rxjs'

import {
  EventTypes, 
  EventTypeToProperties, 
  EventTypeComboOptions, 
  arrayToEventTypeComboOption, 
  eventTypeComboOptionToArray,
  DanceTypes
} from '../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has, metaPropertyToDefaultFunction} from '../../../helpers/listing/utils'
import EventTypesAndCategories from './eventTypesAndCategories'


const always_properties = ['name', 'event_types', 'categories', 'description', 'type']
function applyChange(session, val) {
  session.listing.meta.event_types = val.event_types
  session.listing.meta.categories = val.categories

  const expected_properties = {} 
  session.listing.meta.event_types
    .map(x => EventTypeToProperties[x])
    .reduce((acc, val) => acc.concat(val), [])
    .concat(always_properties)
    .forEach(x => expected_properties[x] = true)

  const all_properties = {}
  const separated: any = Object.keys(EventTypes)
    .map(x => {
      const out = EventTypeToProperties[x.toLowerCase()]
      return out
    })
    .reduce((acc: any, val) => {
      const out = acc.concat(val)
      return out
    }, [])

  separated
    .concat(always_properties)
    .forEach(x => {
      all_properties[x] = expected_properties[x] ? true : false
    })

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
  const event_types_and_categories = EventTypesAndCategories(sources, inputs)

  return {
    ...event_types_and_categories,
    output$: event_types_and_categories.output$
      .map(data => {
        return {
          data,
          apply: applyChange,
          valid: true,
          errors: []
        }
      })
  }
}