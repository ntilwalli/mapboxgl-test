import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {
  EventTypes, 
  EventTypeToProperties, 
  EventTypeComboOptions, 
  arrayToEventTypeComboOption, 
  eventTypeComboOptionToArray,
  DanceTypes
} from '../../../../../listingTypes'

import {findDance} from '../../../../helpers/listing/utils'
import Subcategories from './subcategories'

export default function DanceCategories(sources, inputs) {
    const dance_props$ = O.of({
    parent_category: 'dance',
    base: DanceTypes,
    finder: findDance
  })

  const dance_component = isolate(Subcategories)(sources, {
    ...inputs, 
    initial_state$: inputs.categories$, 
    props$: dance_props$
  })

  return {
    ...dance_component,
    output$: dance_component.output$.map(x => ({
      data: x
    }))
  }
}