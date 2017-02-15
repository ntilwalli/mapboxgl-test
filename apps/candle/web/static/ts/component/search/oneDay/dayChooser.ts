import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify} from '../../../utils'

import BootstrapDateInput from '../../../library/bootstrapDateInput'

function view(components) {
  return combineObj(components)
    .map((components: any) => {
      return div('.day-chooser', [
        components.chooser
      ])
    })
}

export default function main(sources, inputs) {
  const out = isolate(BootstrapDateInput)(sources, inputs)
  const components = {
    chooser: out.DOM
  }

  const vtree$ = view(components)

  return {
    DOM: vtree$,
    output$: out.output$
  }
}