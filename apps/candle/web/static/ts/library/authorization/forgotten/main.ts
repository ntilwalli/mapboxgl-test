import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'

import view from './view'
import intent from './intent'
import model from './model'

import {combineObj, createProxy} from '../../../utils'
//import TextInput from '../../textInput'
//import TextInput, {SmartTextInputValidation} from '../../smartTextInput'
import {EmailInputComponent} from '../../components'

import validator = require('validator')
const {isEmail} = validator



const email_input_props = {
  placeholder: 'E-mail address',
  name: 'email',
  autofocus: true,
  //required: true,
  style_class: '.email-input',
  // key: `login`
  empty_is_error: true
}

const BACKEND_URL = '/api_auth/forgotten'

export default function main(sources, inputs) {

  const actions = intent(sources)
  // const email_input = isolate(TextInput)(sources, {
  //   validator: isEmail,
  //   props$: email_input_props, 
  //   initialText$: O.of(undefined),
  //   highlight_error$: actions.submit$.mapTo(true).startWith(false)
  // })
  const email_output$ = createProxy()
  const state$ = model(actions, {
    ...inputs,
    email$: email_output$
  })


  const email_input = isolate(EmailInputComponent)(sources, O.of(undefined),  state$.pluck('show_errors').distinctUntilChanged(), email_input_props)

  email_output$.attach(email_input.output$)



  const vtree$ = view(state$, {
    email$: email_input.DOM
  })

  return {
    DOM: vtree$,
    HTTP: O.never(),
    MessageBus: O.never()
    // O.merge(
    //   O.merge(
    //     actions.submit$.withLatestFrom(state$, (_, state) => {
    //       const {email} = state
    //       return {
    //         type: `local`,
    //         data: {email: email.data}
    //       }
    //     })
    //   ).map(x => ({to: `/authorization/login`, message: x})),
    // )
    //.do(x => console.log(`login message`, x))
  }
}
