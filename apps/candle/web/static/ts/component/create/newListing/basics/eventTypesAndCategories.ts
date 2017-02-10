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
  eventTypeComboOptionToArray,
  DanceTypes
} from '../../../../listingTypes'

import {findDance} from './utils'
import {fromCheckbox, processCheckboxArray, has, metaPropertyToDefaultFunction} from '../../../helpers/listing/utils'
import ComboBox from '../../../../library/comboBox'
import AllCategories from './categories/main'
import Subcategories from './categories/subcategories'
import FocusWrapper from '../focusWrapperWithInstruction'

function BlankComponent() {
  return {
    DOM: O.of(undefined),
    output$: O.of({data: []})
  }
}

function DanceCategories(sources, inputs) {
    const dance_props$ = O.of({
    parent_category: 'dance',
    base: DanceTypes,
    finder: findDance
  })

  const dance_component = isolate(Subcategories)(sources, {
    ...inputs, 
    initial_state$: inputs.init_categories$, 
    props$: dance_props$
  })

  return {
    ...dance_component,
    output$: dance_component.output$.map(x => ({
      data: x
    }))
  }
}

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
  const init_event_types$ = inputs.session$
    .map(session => session.listing.meta.event_types)
    .map(arrayToEventTypeComboOption)

  const init_categories$ = inputs.session$
    .map(session => {
      return session.listing.meta.categories
    }).publishReplay(1).refCount()

  const options = Object.keys(EventTypeComboOptions).map(x => EventTypeComboOptions[x])

  const event_type_instruction = 'Choosing the right event type allows you to configure additional properties like the performer sign-up start time (open-mic) or audience cost (show) if relevant.'
  const event_type = isolate(ComboBox)(sources, options, init_event_types$)
  const event_type_section: any = isolate(FocusWrapper)(sources, {component: event_type, title: 'Event type', instruction: event_type_instruction})
  
  const categories_instruction = 'Categories determine what filters apply to the listing during search'
  const categories$ = event_type.output$.map(type => {
    switch (type) {
      case EventTypeComboOptions.OPEN_MIC:
      case EventTypeComboOptions.OPEN_MIC_AND_SHOW:
      case EventTypeComboOptions.SHOW:
        return AllCategories(sources, inputs)
      case EventTypeComboOptions.DANCE:
        return DanceCategories(sources, {...inputs, init_categories$})
      default:
        return BlankComponent()
    }
  }).publishReplay(1).refCount()

  const categories = componentify(categories$)
  const categories_section: any = isolate(FocusWrapper)(sources, {component: categories, title: 'Categories', instruction: categories_instruction})
  



  // const categories$ = event_types.output$.map(type => {
  //   switch (type) {
  //     case EventTypeComboOptions.OPEN_MIC:
  //     case EventTypeComboOptions.OPEN_MIC_AND_SHOW:
  //     case EventTypeComboOptions.SHOW:
  //       return AllCategories(sources, inputs)
  //     case EventTypeComboOptions.DANCE:
  //       return DanceCategories(sources, {...inputs, init_categories$})
  //     default:
  //       return BlankComponent()
  //   }
  // }).publishReplay(1).refCount()

  // const categories = componentify(categories$)

  const components = {
    event_types: event_type_section.DOM,
    categories: categories_section.DOM
  }

  const vtree$ = combineObj(components)
    .map((components: any) => {
      return div([
        div([
          components.event_types,
        ]),
        components.categories ? div('.mt-4', [
          components.categories
        ]) : null
      ])
    })

  const merged = mergeSinks(categories, event_type)
  const focus$ = O.merge(categories_section.focus$, event_type_section.focus$)

  return {
    ...merged,
    DOM: vtree$,
    output$: combineObj({
        event_type$: event_type_section.output$,
        categories$: categories$.switchMap((x: any) => x.output$)
      })
      .map((info: any) => {
        return {
          data: {
            event_types: eventTypeComboOptionToArray(info.event_type),
            categories: info.categories.data
          },
          apply: applyChange,
          valid: true,
          errors: []
        }
      })
      .publishReplay(1).refCount(),
    focus$
  }
}