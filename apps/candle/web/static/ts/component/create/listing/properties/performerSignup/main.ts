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
import {RelativeTimeOptions as opts, TimeOptionComponent, TimeTypeComboBox, RegistrationInfoComponent} from '../helpers'
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

function getInPersonComponents(performer_signup$, sources, inputs) {
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
        //return begins.data
        return begins
      } else {
        throw new Error('Invalid begins type')
      }
    })

  const ends$ = valid_in_person$.pluck('ends')

  const invalid_in_person$ = in_person$.filter(x => !x).publishReplay(1).refCount()//.switchMap(x => O.never())


  const begins_props$ = O.merge(begins$, invalid_in_person$)
  const ends_props$ = O.merge(ends$, invalid_in_person$).publishReplay(1).refCount()

  const options = [
    //opts.BLANK,
    opts.EVENT_START,
    opts.MINUTES_BEFORE_EVENT_START,
    opts.MINUTES_BEFORE_EVENT_END,
    opts.EVENT_END
  ]

  return [
    TimeOptionComponent(sources, 'In-person sign-up begins', begins_props$),
    TimeOptionComponent(sources, 'In-person sign-up ends', ends_props$),
    TimeTypeComboBox(sources, options, ends_props$.map((x: any) => !!x ? x.type : undefined).publishReplay(1).refCount(), `.in-person-ends`)
  ]
}

function getRegistrationComponents(performer_signup$, sources, inputs) {
  const registration$ = performer_signup$.map(items => {
    const index = items.findIndex(item => item.type === 'registration')
    if (index >= 0) {
      return items[index].data
    } else {
      return undefined
    }
  }).publishReplay(1).refCount()

  const valid_registration$ = registration$.filter(x => !!x).publishReplay(1).refCount()
  
  const begins$ = valid_registration$.pluck('begins')
  const ends$ = valid_registration$.pluck('ends')

  const invalid_registration$ = registration$.filter(x => !x).publishReplay(1).refCount()//.switchMap(x => O.never())


  const begins_props$ = O.merge(begins$, invalid_registration$).publishReplay(1).refCount()
  const ends_props$ = O.merge(ends$, invalid_registration$).publishReplay(1).refCount()

  const begins_options = [
    //opts.BLANK,
    opts.UPON_POSTING,
    // opts.DAYS_BEFORE_EVENT_START,
    opts.PREVIOUS_WEEKDAY_AT_TIME,
    opts.MINUTES_BEFORE_EVENT_START
  ]

  const ends_options = [
    //opts.BLANK,
    opts.EVENT_START,
    opts.PREVIOUS_WEEKDAY_AT_TIME,
    // opts.DAYS_BEFORE_EVENT_START,
    opts.MINUTES_BEFORE_EVENT_START,
    opts.MINUTES_BEFORE_EVENT_END,
    opts.EVENT_END
  ]

  const registration_props$ = O.merge(valid_registration$, invalid_registration$).publishReplay(1).refCount()
  return [
    TimeOptionComponent(sources, 'Pre-registration begins', begins_props$),
    TimeOptionComponent(sources, 'Pre-registration ends', ends_props$),
    TimeTypeComboBox(sources, begins_options, begins_props$.map((x: any) => !!x ? x.type : undefined)
      .publishReplay(1).refCount(), `registration-start`),
    TimeTypeComboBox(sources, ends_options, ends_props$.map((x: any) => !!x ? x.type : undefined)
      .publishReplay(1).refCount(), `.registration-end`),
    RegistrationInfoComponent(sources, 'Pre-registration info', registration_props$)
  ]
}


export default function main(sources, inputs) {
  const actions = intent(sources)
  const in_person_begins_input$ = createProxy()
  const in_person_ends_input$ = createProxy()
  const in_person_ends_time_type_input$ = createProxy()
  const registration_begins_input$ = createProxy()
  const registration_ends_input$ = createProxy()
  const registration_begins_time_type_input$ = createProxy()
  const registration_ends_time_type_input$ = createProxy()
  const registration_info_input$ = createProxy()
  const state$ = model(actions, {
    ...inputs,
    in_person_begins_input$,
    in_person_ends_input$,
    in_person_ends_time_type_input$,
    registration_begins_input$,
    registration_ends_input$,
    registration_begins_time_type_input$,
    registration_ends_time_type_input$,
    registration_info_input$
  })

  const performers_signup$ = state$.pluck('performer_signup')
    .publishReplay(1).refCount()
  
  const [
    in_person_begins_component, 
    in_person_ends_component, 
    in_person_ends_time_type_component
  ] = getInPersonComponents(performers_signup$, sources, inputs)

  const [
    registration_begins_component, 
    registration_ends_component, 
    registration_begins_time_type_component,
    registration_ends_time_type_component,
    registration_info_component
  ] = getRegistrationComponents(performers_signup$, sources, inputs)

  in_person_begins_input$.attach(in_person_begins_component.output$)
  in_person_ends_input$.attach(in_person_ends_component.output$)
  in_person_ends_time_type_input$.attach(in_person_ends_time_type_component.output$)

  registration_begins_input$.attach(registration_begins_component.output$)
  registration_ends_input$.attach(registration_ends_component.output$)
  registration_begins_time_type_input$.attach(registration_begins_time_type_component.output$)
  registration_ends_time_type_input$.attach(registration_ends_time_type_component.output$)
  registration_info_input$.attach(registration_info_component.output$)

  const components = {
    in_person_begins: in_person_begins_component.DOM,
    in_person_ends: in_person_ends_component.DOM,
    in_person_ends_time_type: in_person_ends_time_type_component.DOM,
    registration_begins: registration_begins_component.DOM,
    registration_ends: registration_ends_component.DOM,
    registration_begins_time_type: registration_begins_time_type_component.DOM,
    registration_ends_time_type: registration_ends_time_type_component.DOM,
    registration_info: registration_info_component.DOM
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$.map(x => {
      const errors = Object.keys(x.errors_map).reduce((acc, val) => acc.concat(x.errors_map[val]), [])
      return {
        value: x.performer_signup,
        valid: errors.length === 0,
        errors
      }
    })
  }
}