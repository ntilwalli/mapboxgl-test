import {Observable as O} from 'rxjs'
// import {div, span, input} from '@cycle/dom'
// import Immutable = require('immutable')
// import {combineObj} from '../../../../../utils'
import intent from './intent'
import model from './model'
import view from './view'
import deepEqual = require('deep-equal')

function isValid(val) {
  return !!val.length
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$, {})
  return {
    DOM: vtree$,
    output$: state$.map(x => ({
      prop: x.performer_signup, 
      valid: isValid(x.performer_signup)
    }))
  }
}