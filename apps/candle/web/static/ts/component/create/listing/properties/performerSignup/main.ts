import {Observable as O} from 'rxjs'
// import {div, span, input} from '@cycle/dom'
// import Immutable = require('immutable')
// import {combineObj} from '../../../../../utils'
import intent from './intent'
import model from './model'
import view from './view'
import deepEqual = require('deep-equal')
import {createProxy, blankComponentUndefinedDOM} from '../../../../../utils'

import {default as TextInput, SmartTextInputValidation} from '../../../../../library/SmarterTextInput'

function validateItem(item) {
  const {type, data} = item
  if (type === 'registration') {
    if (data) {
      const r_type = data.type
      const r_data = data.data
      if (r_type === 'app') {
        return r_data.begins && r_data.ends
      } else if (r_type === 'email') {
        return false
      } else if (r_type === 'website') {
        return false
      }
    } else {
      return false
    }
  } else if (type === 'in-person') {
    return data.begins && data.styles.length
  }

  throw new Error('Invalid signup type: ' + type)
}

function isValid(performer_signup) {
  if(!!performer_signup.length) {
    return performer_signup.every(validateItem)
  } else {
    return false
  }
}

const timeInputProps = O.of({
  placeholder: ``,
  name: `in-person-begins`,
  styleClass: `.time-input`,
  emptyIsError: true
})
  
function createTimeValidator(message): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    if (input && input.match(/^\d+$/)) {
      return {
        value: parseInt(input),
        errors: []
      }
    } else {
      return {
        value: input,
        errors: [message]
      }
    }
  }
}

function getInPersonBeginsComponent(performer_signup$, sources, inputs) {
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
      if (begins.type === 'minutes-before-event-start') {
        return begins.data
      } else {
        throw new Error('Invalid begins type')
      }
    })

  const invalid_in_person$ = in_person$.filter(x => !x)//.switchMap(x => O.never())

  return O.merge(begins$, invalid_in_person$)
    .distinctUntilChanged(x => !!x)
    .map(val => {
      if (val) {
        return TextInput(sources, {
          validator: createTimeValidator('In-person sign-up start invalid'),
          props$: timeInputProps, 
          initialText$: O.of(val).map(x => x.toString())
        })
      } else {
        return {
          DOM: O.of(undefined),
          output$: O.never()
        }
      }
    }).publishReplay(1).refCount()
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const in_person_input$ = createProxy()
  const state$ = model(actions, {
    ...inputs,
    in_person_input$
  })

  const performers_signup$ = state$.pluck('performer_signup')
    .publishReplay(1).refCount()
  
  const in_person_begins_input$ = getInPersonBeginsComponent(performers_signup$, sources, inputs)

  in_person_input$.attach(in_person_begins_input$.switchMap(x => x.output$))

  const components = {
    in_person_begins: in_person_begins_input$.switchMap(x => x.DOM)
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$.map(x => ({
      prop: x.performer_signup,
      valid: isValid(x.performer_signup),
      errors: Object.keys(x.errors_map).reduce((acc, val) => acc.concat(x.errors_map[val]), [])
    }))
  }
}