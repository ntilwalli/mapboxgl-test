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

import {findDance} from '../../../helpers/listing/utils'
import ComboBox from '../../../../library/comboBox'
import CategoriesSwitcher from './categories/categoriesSwitcher'
import AllCategories from './categories/allCategories'
import Subcategories from './categories/subcategories'
import DanceSubcategories from './categories/danceSubcategories'
import FocusWrapper from '../focusWrapperWithInstruction'

function BlankComponent() {
  return {
    DOM: O.of(undefined),
    output$: O.of({data: []})
  }
}

export default function main(sources, inputs) {
  const init_event_types$ = inputs.event_types$
    .map(arrayToEventTypeComboOption)
    .publishReplay(1).refCount()

  const init_categories$ = inputs.categories$
    .publishReplay(1).refCount()

  const options = Object.keys(EventTypeComboOptions).map(x => EventTypeComboOptions[x])

  const event_type_instruction = 'Choosing the right event type allows you to configure additional properties like the performer sign-up start time (open-mic) or audience cost (show) if relevant.'
  const event_type = isolate(ComboBox)(sources, options, init_event_types$)
  const event_type_section: any = isolate(FocusWrapper)(sources, {component: event_type, title: 'Event type', instruction: event_type_instruction})
  
  const categories_instruction = 'Categories determine what filters apply to the listing during search'
  // const categories$ = event_types.output$.map(type => {
  //   switch (type) {
  //     case EventTypeComboOptions.OPEN_MIC:
  //     case EventTypeComboOptions.OPEN_MIC_AND_SHOW:
  //     case EventTypeComboOptions.SHOW:
  //       return AllCategories(sources, {...inputs, event_types$: event_types.output$})
  //     case EventTypeComboOptions.DANCE:
  //       return DanceSubcategories(sources, inputs)
  //     default:
  //       return BlankComponent()
  //   }
  // }).publishReplay(1).refCount()

  // const categories = componentify(categories$)
  const categories = CategoriesSwitcher(sources, {
    ...inputs, 
    event_type$: event_type.output$
  })
  const categories_section: any = isolate(FocusWrapper)(sources, {component: categories, title: 'Categories', instruction: categories_instruction})

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
        categories$: categories.output$
      })
      .map((info: any) => {
        return {
          event_types: eventTypeComboOptionToArray(info.event_type),
          categories: info.categories.data
        }
      })
      .publishReplay(1).refCount(),
    focus$
  }
}