import {Observable as O} from 'rxjs'
import {
  EventTypes, 
  EventTypeToProperties, 
  EventTypeComboOptions, 
  arrayToEventTypeComboOption, 
  eventTypeComboOptionToArray,
  DanceTypes
} from '../../../../../listingTypes'
import {combineObj, mergeSinks, componentify} from '../../../../../utils'
import AllCategories from './allCategories'
import Subcategories from './subcategories'
import DanceSubcategories from './danceSubcategories'
  
function BlankComponent() {
  return {
    DOM: O.of(undefined),
    output$: O.of({data: []})
  }
}

export default function main(sources, inputs) {
  const categories$ = inputs.event_type$.map(type => {
    switch (type) {
      case EventTypeComboOptions.OPEN_MIC:
      case EventTypeComboOptions.OPEN_MIC_AND_SHOW:
      case EventTypeComboOptions.SHOW:
        return AllCategories(sources, inputs)
      case EventTypeComboOptions.DANCE:
        return DanceSubcategories(sources, inputs)
      default:
        return BlankComponent()
    }
  }).publishReplay(1).refCount()


  return {
    DOM: categories$.switchMap(x => x.DOM),
    output$: categories$.switchMap(x => x.output$)
  }
}