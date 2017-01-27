import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'

import view from './view'
import intent from './intent'
import model from './model'

import {combineObj, createProxy, processHTTP, traceStartStop} from '../../../utils'
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

const BACKEND_URL = '/api_auth/forgotten_password'

function fromHTTP(sources) {
  const {HTTP} = sources

  const {success$, error$} = processHTTP(sources, 'forgotten_password')

  return {
    success$,
    error$
  }
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const from_http = fromHTTP(sources)
  const in_to_http$ = createProxy()
  // const email_input = isolate(TextInput)(sources, {
  //   validator: isEmail,
  //   props$: email_input_props, 
  //   initialText$: O.of(undefined),
  //   highlight_error$: actions.submit$.mapTo(true).startWith(false)
  // })
  const show_errors$ = createProxy()


  const email_input = isolate(EmailInputComponent)(sources, O.of(undefined), show_errors$.letBind(traceStartStop('show_errors')), email_input_props)

  const state$ = model(actions, {
    ...inputs,
    email$: email_input.output$.map(x => {
      return x
    }),
    ...from_http,
    to_http$: in_to_http$
  })



  show_errors$.attach(state$.pluck('show_errors').delay(1).distinctUntilChanged().letBind(traceStartStop('state_show_errors')))



  const vtree$ = view(state$, {
    email$: email_input.DOM.map(x => {
      return x
    })
  })


  const out_to_http$ = actions.submit$.withLatestFrom(state$, (_, state) => {
      return state
    })
    .filter(state => state.valid)
    .pluck('email')
    .map(email => ({
        url: BACKEND_URL,
        method: `post`,
        type: `json`,
        send: {
          email
        },
        category: `forgotten_password`
    }))

  in_to_http$.attach(out_to_http$)

  return {
    DOM: vtree$,
    HTTP: out_to_http$,
    //MessageBus: O.never()
  }
}
