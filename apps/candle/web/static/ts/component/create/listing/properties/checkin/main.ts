import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
// import {div, span, input} from '@cycle/dom'
// import Immutable = require('immutable')
// import {combineObj} from '../../../../../utils'
import intent from './intent'
import model from './model'
import view from './view'
import deepEqual = require('deep-equal')
import {createProxy, blankComponentUndefinedDOM} from '../../../../../utils'
import {RelativeTimeOptions as opts, TimeOptionComponent, TimeTypeComboBox, NumberInputComponent} from '../helpers'
import {default as TextInput, SmartTextInputValidation} from '../../../../../library/smarterTextInput'


function validateItem(item) {
  const {type, data} = item
  if (type === 'registration') {
    if (data) {
      const r_type = data.type
      const r_data = data.data
      if (r_type === 'email' && !r_data) {
        return false
      } else if (r_type === 'website' && !r_data) {
        return false
      }

      return true
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

function getCheckInComponents(check_in$, sources, inputs) {
  const shared$ = check_in$.publishReplay(1).refCount()
  const begins$ = shared$.pluck('begins')
  const ends$ = shared$.pluck('ends').publishReplay(1).refCount()
  const radius$ = shared$.pluck('radius')
  const options = [
    //opts.BLANK,
    opts.EVENT_START,
    opts.MINUTES_BEFORE_EVENT_START,
    opts.MINUTES_AFTER_EVENT_START,
    opts.MINUTES_BEFORE_EVENT_END,
    opts.EVENT_END
  ]

  return [
    TimeOptionComponent(sources, 'Check-in begins', begins$),
    TimeOptionComponent(sources, 'Check-in ends', ends$),
    TimeTypeComboBox(sources, options, ends$.map((x: any) => !!x ? x.type : undefined).publishReplay(1).refCount(), `.in-person-ends`),
    NumberInputComponent(sources, radius$.map(x => x ? x.toString() : undefined), 'Check-in radius: Invalid number')
  ]
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const begins_input$ = createProxy()
  const ends_input$ = createProxy()
  const ends_time_type_input$ = createProxy()
  const radius_input$ = createProxy()
  const state$ = model(actions, {
    ...inputs,
    begins_input$,
    ends_input$,
    ends_time_type_input$,
    radius_input$
  })

  const check_in$ = state$.pluck('check_in')
    .publishReplay(1).refCount()
  
  const [
    begins_component, 
    ends_component, 
    ends_time_type_component,
    radius_component
  ] = getCheckInComponents(check_in$, sources, inputs)

  begins_input$.attach(begins_component.output$)
  ends_input$.attach(ends_component.output$)
  ends_time_type_input$.attach(ends_time_type_component.output$)
  radius_input$.attach(radius_component.output$)
  const components = {
    begins: begins_component.DOM,
    ends: ends_component.DOM,
    ends_time_type: ends_time_type_component.DOM,
    radius: radius_component.DOM,
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$.map(x => {
      const errors = Object.keys(x.errors_map).reduce((acc, val) => acc.concat(x.errors_map[val]), [])
      return {
        value: x.check_in,
        valid: errors.length === 0,
        errors
      }
    })
  }
}