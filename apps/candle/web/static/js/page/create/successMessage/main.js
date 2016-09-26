import {Observable as O} from 'rxjs'
import {div} from '@cycle/DOM'
import isolate from '@cycle/isolate'
import intent from './intent'
import model from './model'
import view from './view'

import Immutable from 'immutable'

import {combineObj, normalizeComponent, mergeSinks, spread} from '../../../utils'

import Heading from '../../../library/heading/standard/main'

function main(sources, inputs) {
  const heading = normalizeComponent(Heading(sources, inputs))
  const actions = intent(sources)
  const state$ = O.never()
  const components = {
    heading$: heading.DOM
  }
  const vtree$ = view(inputs.props$, components)

  // return spread(mergeSinks(heading), {
  //   DOM: vtree$
  // })

  return normalizeComponent({
    DOM: vtree$
  })
}

export default (sources, inputs) => main(sources, inputs)
