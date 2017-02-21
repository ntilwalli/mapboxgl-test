import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input, label, em, strong, i, h4, h5, h6, VNode} from '@cycle/dom'
import {combineObj, createProxy, traceStartStop, mergeSinks, componentify} from '../../../../../utils'
import {
  ComboBox
} from '../helpers'

import {
  AgeRestrictionOptions
} from '../../../../../listingTypes'

import clone = require('clone')

function AgeRestrictionComboBox(sources, props$) {
  const options = [
    AgeRestrictionOptions.ALL_AGES,
    AgeRestrictionOptions.OVER_18,
    AgeRestrictionOptions.OVER_21
  ]

  return isolate(ComboBox)(sources, options, props$)
}

export function getDefault() {
  return {
    type: AgeRestrictionOptions.ALL_AGES
  }
}

export default function main(sources, inputs) {
  const shared$ = inputs.props$.take(1)
    .map(props => {
      return props || getDefault()
    })
    .publishReplay(1).refCount()


  const age_restriction = AgeRestrictionComboBox(sources, shared$.pluck('type'))

  const vtree$ = combineObj({
    age_restriction: age_restriction.DOM,
  }).debounceTime(0).map((components: any) => {
    const {age_restriction} = components

    return div([
      div('.mb-xs', [
        age_restriction
      ])
    ])
  })

  const output$ = combineObj({
    age_restriction: age_restriction.output$
  })
  .debounceTime(5).map((info: any) => {
    const {age_restriction} = info

    return {
      errors: [],
      valid: true,
      data: {
        type: age_restriction
      }
    }
  })
  .publishReplay(1).refCount()

  const merged = mergeSinks(age_restriction)
  const component = {
    ...merged,
    DOM: vtree$,
    output$
  }

  return component

}