import {Observable as O} from 'rxjs'
import {div, a, i, header, section, span, button, label, input, nav, h6} from '@cycle/dom'

import intent from './intent'
import model from './model'
import view from './view'

import Heading from '../../library/heading/standard/main'
import WithMapFakeComponent from '../../fake/withMap/main'
import UserLocationMap from './userLocationMap/main'

import {combineObj, normalizeComponent} from '../../utils'

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const heading = Heading(sources, inputs)
  //const content = normalizeComponent(WithMapFakeComponent(sources, inputs))
  const content = UserLocationMap(sources, inputs)
  
  const components = {
    heading$: heading.DOM,
    content$: content.DOM
  }

  const vtree$ = view(state$, components)

  const out = {
    DOM: vtree$,
    MapDOM: content.MapDOM,
    HTTP: O.merge(heading.HTTP, content.HTTP),
    Router: O.merge(heading.Router, content.Router).map(x => {
      return x
    }),
    Global: O.merge(heading.Global, content.Global),
    Storage: O.merge(heading.Storage, content.Storage),
    message$: O.merge(heading.message$, content.message$).map(x => {
      return x
    })
  }

  return out

}
