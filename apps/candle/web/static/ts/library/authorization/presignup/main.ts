import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import view from './view'
import intent from './intent'
import model from './model'
import {combineObj, spread} from '../../../utils'
import TextInput, {SmartTextInputValidation} from '../../smartTextInput'
// import isEmail from 'validator/lib/isEmail'
// import isAlphanumeric from 'validator/lib/isAlphanumeric'
// import isAlpha from 'validator/lib/isAlpha'
import validator = require('validator')
const {isEmail, isAlphanumeric, isAlpha} = validator



function emailParser(val): SmartTextInputValidation {
  if (val && isEmail(val)) {
    return {value: val, errors: []}
  } else {
    return {value: undefined, errors: [`Invalid e-mail address`]}
  }
}

const emailInputProps = O.of({
  placeholder: `E-mail address`,
  name: `email`,
  required: true,
  styleClass: `.auth-input`
})

function usernameParser(val): SmartTextInputValidation {
  if (val && isAlpha(val.substring(0, 1)) && isAlphanumeric(val)) return {value: val, errors: []}
  else return {value: undefined, errors: [`Username must start with a letter and be alphanumeric`]}
}

const usernameInputProps = O.of({
  placeholder: `Username`,
  name: `username`,
  required: true,
  styleClass: `.auth-input`
})

const nameInputProps = O.of({
  placeholder: `Display name`,
  name: `name`,
  required: true,
  styleClass: `.auth-input`
})

const BACKEND_URL = `/api_auth/presignup`


export default function main(sources, inputs) {

  const error$ = sources.MessageBus.address(`/modal/presignup`)
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .publishReplay(1).refCount()

  const nameInput = TextInput(sources, {
    props$: nameInputProps, 
    error$,
    initialText$: sources.Global.cookie$
      .map(x => x.suggested_name)
  })

  const usernameInput = TextInput(sources, {
    parser: usernameParser,
    props$: usernameInputProps, 
    error$,
    initialText$: O.of(undefined)
  })

  const emailInput = TextInput(sources, {
    parser: emailParser,
    props$: emailInputProps, 
    error$,
    initialText$: O.of(undefined)
  })

  const actions = intent(sources)
  const state$ = model(actions, spread(
    inputs, {
    email$: emailInput.output$,
    name$: nameInput.output$,
    username$: usernameInput.output$,
    error$
  }))

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
        message: {type: `attempt`, data: {type, name, username, email}}
      }
    })
  }
}
