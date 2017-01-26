import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import view from './view'
import intent from './intent'
import model from './model'
import {combineObj, createProxy} from '../../../utils'
import TextInput, {SmartTextInputValidation} from '../../bootstrapTextInputGated'
import {EmailInputComponent} from '../../components'
// import isEmail from 'validator/lib/isEmail'
// import isAlphanumeric from 'validator/lib/isAlphanumeric'
// import isAlpha from 'validator/lib/isAlpha'
import validator = require('validator')
const {isEmail, isAlphanumeric, isAlpha} = validator

function emailValidator(val): SmartTextInputValidation {
  if (val && isEmail(val)) {
    return {value: val, errors: []}
  } else {
    return {value: undefined, errors: [`Invalid e-mail address`]}
  }
}

const email_input_props = {
  placeholder: `E-mail address`,
  name: `email`,
  style_class: `.auth-input`,
  empty_is_error: true,
  autofocus: false
}

function usernameValidator(val): SmartTextInputValidation {
  if (val && isAlpha(val.substring(0, 1)) && isAlphanumeric(val)) {
    return {value: val, errors: []}
  } else {
    return {value: undefined, errors: [`Username must start with a letter and be alphanumeric`]}
  }
}
const username_input_props = O.of({
  autofocus: false,
  placeholder: `Username`,
  name: `username`,
  style_class: `.auth-input`,
  empty_is_error: true
})

const name_input_props = O.of({
  autofocus: true,
  placeholder: `Display name`,
  name: `name`,
  style_class: `.auth-input`,
  empty_is_error: true
})


const BACKEND_URL = `/api_auth/presignup`


export default function main(sources, inputs) {

  const errors$ = sources.MessageBus.address(`/modal/presignup`)
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .publishReplay(1).refCount()

  const highlight_error$ = createProxy()

  const nameInput = isolate(TextInput)(sources, {
    props$: name_input_props, 
    errors$,
    initial_text$: sources.Global.cookie$
      .map(x => x.suggested_name),
    highlight_error$
  })

  const usernameInput = isolate(TextInput)(sources, {
    validator: usernameValidator,
    props$: username_input_props, 
    errors$,
    initial_text$: O.of(undefined),
    highlight_error$
  })

  const emailInput = EmailInputComponent(sources, O.of(undefined), highlight_error$, email_input_props)

  const actions = intent(sources)
  const state$ = model(actions, {
    ...inputs, 
    email$: emailInput.output$,
    name$: nameInput.output$,
    username$: usernameInput.output$,
    errors$,
    cookie$: sources.Global.cookie$
  })

  highlight_error$.attach(state$.pluck('show_errors').distinctUntilChanged())

  const vtree$ = view(combineObj({
    state$,
    components$: combineObj({
      email$: emailInput.DOM,
      name$: nameInput.DOM,
      username$: usernameInput.DOM
    })
  }))

  return {
    DOM: vtree$,
    MessageBus: actions.submit$.withLatestFrom(state$, (_, state) => {
      const {type, name, username, email} = state
      return {
        to: `/authorization/presignup`,
        message: {type: `attempt`, data: {
          type: "individual", 
          name: name.data, 
          username: username.data, 
          email: email.data,
          data: state.props
        }}
      }
    })
  }
}
