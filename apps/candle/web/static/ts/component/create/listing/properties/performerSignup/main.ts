import {Observable as O} from 'rxjs'
// import {div, span, input} from '@cycle/dom'
// import Immutable = require('immutable')
// import {combineObj} from '../../../../../utils'
import intent from './intent'
import model from './model'
import view from './view'
import deepEqual = require('deep-equal')

import TextInput from '../../../../../library/SmarterTextInput'

function isValid(val) {
  return !!val.length
}


const timeInputProps = O.of({
  placeholder: ``,
  name: `in-person-begins`,
  styleClass: `.time-input`
})
  
const timeValidator = input => {
  const output = parseInt(input)
  if (isNaN(output)) {
    if (input === undefined) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: [`Invalid number`]
      }
    }
  } else {
    if (output > 0) {
      return {
        value: output,
        errors: []
      }
    } else {
      return {
        value: output,
        errors: [`Must be empty or greater than zero`]
      }
    }
  }
}

function getInPersonBeginsStream(performer_signup$) {
  const in_person$ = performer_signup$.map(items => {
    const index = items.findIndex(item => item.type === 'in-person')
    if (index >= 0) {
      return items[index].data
    } else {
      return undefined
    }
  }).publishReplay(1).refCount()

  const valid_in_person$ = in_person$.filter(x => !!x).publishReplay(1).refCount()
  
  const begins$ = valid_in_person$.pluck('begins')
    .map(begins => {
      console.log(`begins`, begins)
      if (begins.type === 'minutes-before-event-start') {
        return begins.data
      } else {
        throw new Error('Invalid begins type')
      }
    })

  const invalid_in_person$ = in_person$.filter(x => !x)
  
  return O.merge(begins$, invalid_in_person$)
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const performers_signup$ = state$.pluck('performer_signup')
    .publishReplay(1).refCount()
  
  const in_person_begins$ = getInPersonBeginsStream(performers_signup$)

  const in_person_begins_input = TextInput(sources, {
    validator: timeValidator,
    props$: timeInputProps, 
    initialText$: in_person_begins$
  })

  const components = {
    in_person_begins: in_person_begins_input.DOM 
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$.map(x => ({
      prop: x.performer_signup, 
      valid: isValid(x.performer_signup)
    }))
  }
}