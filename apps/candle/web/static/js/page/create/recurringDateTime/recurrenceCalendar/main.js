import {Observable as O} from 'rxjs'
import {div} from '@cycle/DOM'

import {combineObj, spread, normalizeComponent, normalizeSink, createProxy} from '../../../../utils'

import SelectionCalendar from '../../../../library/selectionCalendar/main'

function intent(sources) {

}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map(info => {
      const {components} = info
      return components.selectionCalendar
    })
}

export default function main(sources, inputs) {
  const sharedProps$ = inputs.props$.publishReplay(1).refCount()
  const sc = SelectionCalendar(sources, {
      props$: sharedProps$
    })
  const components = {
    selectionCalendar$: sc.DOM
  }
  return {
    DOM: view(sharedProps$, components)
  }
}