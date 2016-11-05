import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import view from './view'
import intent from './intent'
import model from './model'
import {combineObj, spread} from '../../../utils'
import TextInput from '../../../library/textInput'
// import isEmail from 'validator/lib/isEmail'
// import isAlphanumeric from 'validator/lib/isAlphanumeric'
// import isAlpha from 'validator/lib/isAlpha'
import validator = require('validator')
const {isEmail, isAlphanumeric, isAlpha} = validator

const COOKIE_INDICATOR = `cookie`

const emailInputProps = O.of({
  placeholder: `E-mail address`,
  validator: val => {
    if (isEmail(val)) return []
    else return [`Invalid e-mail address`]
  },
  name: `email`,
  required: true,
  key: `presignup`
})

const usernameInputProps = O.of({
  placeholder: `Username`,
  validator: val => {
    if (isAlpha(val.substring(0, 1)) && isAlphanumeric(val)) return []
    else return [`Username must start with a letter and be alphanumeric`]
  },
  name: `username`,
  required: true,
  key: `presignup`
})

const nameInputProps = O.of({
  placeholder: `Display name`,
  name: `name`,
  required: true,
  key: `presignup`
})

const BACKEND_URL = `/api_auth/presignup`


export default function main(sources, inputs) {

  const error$ = inputs.message$
    .filter(x => x.type === `authorization`)
    .map(x => x.data)
    .filter(x => x.type === `presignup`)
    .map(x => x.data)
    .filter(x => x.type === `error`)
    .map(x => x.data)
    //.startWith(undefined)
    .publishReplay(1).refCount()

  const nameInput = TextInput(sources, {
    props$: nameInputProps, 
    error$,
    initialText$: sources.Global
      .filter(x => x.type === COOKIE_INDICATOR && x.data)
      .map(x => x.data)
      .map(x => x.suggested_name)
  })

  const usernameInput = TextInput(sources, {
    props$: usernameInputProps, 
    error$,
    initialText$: O.of(undefined)
  })

  const emailInput = TextInput(sources, {
    props$: emailInputProps, 
    error$,
    initialText$: O.of(undefined)
  })

  const actions = intent(sources)
  const state$ = model(actions, spread(
    inputs, {
    email$: emailInput.value$,
    name$: nameInput.value$,
    username$: usernameInput.value$,
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
    // Global: O.of({
    //   type: `cookie`,
    //   data: {
    //     type: `get`
    //   }
    // }),
    message$: actions.submit$.withLatestFrom(state$, (_, state) => {
      const {type, name, username, email} = state
      return {
        type: `authorization`,
        data: {
          type: `presignup`,
          data: {type: `attempt`, data: {type, name, username, email}}
        }
      }
    })
  }
}
