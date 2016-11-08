import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import view from './view'
import intent from './intent'
import model from './model'
import TextInput, {SmartTextInputValidation} from '../../smartTextInput'
import SmarterTextInput from '../../smarterTextInput'
import {combineObj, spread} from '../../../utils'
import {div} from '@cycle/dom'
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

const emailInputProps = O.of({
  placeholder: `E-mail address`,
  name: `email`,
  styleClass: `.auth-input`
})

function usernameValidator(val): SmartTextInputValidation {
  if (val && isAlpha(val.substring(0, 1)) && isAlphanumeric(val)) {
    return {value: val, errors: []}
  } else {
    return {value: undefined, errors: [`Username must start with a letter and be alphanumeric`]}
  }
}
const usernameInputProps = O.of({
  placeholder: `Username`,
  name: `username`,
  styleClass: `.auth-input`
})

const nameInputProps = O.of({
  placeholder: `Display name`,
  name: `name`,
  styleClass: `.auth-input`
})

const passwordInputProps = O.of({
  type: `password`,
  placeholder: `Password`,
  name: `password`,
  styleClass: `.auth-input`,
  required: true
})

const BACKEND_URL = `/api_auth/signup`

export default function main(sources, inputs) {

  const errors$ = sources.MessageBus.address(`/modal/signup`)
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .map(x => x.errors)
    .publishReplay(1).refCount()


  const nameInput = TextInput(sources, {
    props$: nameInputProps, 
    errors$, 
    initialText$: O.of(undefined)
  })

  const usernameInput = TextInput(sources, {
    validator: usernameValidator,
    props$: usernameInputProps, 
    errors$, 
    initialText$: O.of(undefined)
  })

  const emailInput = TextInput(sources, {
    validator: emailValidator,
    validateOnBlur: true,
    props$: emailInputProps, 
    errors$, 
    initialText$: O.of(undefined)
  })

  const passwordInput = TextInput(sources, {
    props$: passwordInputProps, 
    errors$, 
    initialText$: O.of(undefined)
  })


  const actions = intent(sources)
  const state$ = model(actions, spread(
    inputs, {
    email$: emailInput.output$,
    name$: nameInput.output$,
    username$: usernameInput.output$,
    password$: passwordInput.output$,
    errors$
  }))

  const vtree$ = view(combineObj({
    state$,
    components$: combineObj({
      email$: emailInput.DOM,
      name$: nameInput.DOM,
      username$: usernameInput.DOM,
      password$: passwordInput.DOM
    })
  }))

  return {
    DOM: vtree$,
    MessageBus: O.merge(
      actions.submit$.withLatestFrom(state$, (_, state) => {
        const {name, username, email, password} = state
        return {
          to: `/authorization/signup`,
          message: {type: `attempt`, data: {type: "individual", name, username, email, password}}
        }
      }),
      actions.switchToLogin$.mapTo({to: `main`, message: `showLogin`}),
      O.merge(
        actions.facebook$.mapTo({type: `facebook`}),
        actions.twitter$.mapTo({type: `twitter`}),
        actions.github$.mapTo({type: `github`}),
      ).map(x => {
        return {
          to: `/authorization/login`,
          message: x
        }
      })
    )
  }
}