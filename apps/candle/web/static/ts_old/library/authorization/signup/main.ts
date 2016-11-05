import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import view from './view'
import intent from './intent'
import model from './model'
import TextInput from '../../textInput'
import {combineObj, spread} from '../../../utils'
import {div} from '@cycle/dom'
// import isEmail from 'validator/lib/isEmail'
// import isAlphanumeric from 'validator/lib/isAlphanumeric'
// import isAlpha from 'validator/lib/isAlpha'
import validator = require('validator')
const {isEmail, isAlphanumeric, isAlpha} = validator

const emailInputProps = O.of({
  placeholder: `E-mail address`,
  validator: val => {
    if (isEmail(val)) return []
    else return [`Invalid e-mail address`]
  },
  name: `email`,
  required: true,
  key: `signup`
})

const usernameInputProps = O.of({
  placeholder: `Username`,
  validator: val => {
    if (isAlpha(val.substring(0, 1)) && isAlphanumeric(val)) return []
    else return [`Username must start with a letter and be alphanumeric`]
  },
  name: `username`,
  required: true,
  key: `signup`
})

const nameInputProps = O.of({
  placeholder: `Display name`,
  name: `name`,
  required: true,
  key: `signup`
})

const passwordInputProps = O.of({
  type: `password`,
  placeholder: `Password`,
  name: `password`,
  required: true,
  key: `signup`
})

const BACKEND_URL = `/api_auth/signup`

export default function main(sources, inputs) {

  const error$ = inputs.message$
    .filter(x => x.type === `authorization`)
    .map(x => x.data)
    .filter(x => x.type === `signup`)
    .map(x => x.data)
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .publishReplay(1).refCount()


  const nameInput = TextInput(sources, {
    props$: nameInputProps, 
    error$, 
    initialText$: O.of(undefined)
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

  const passwordInput = TextInput(sources, {
    props$: passwordInputProps, 
    error$, 
    initialText$: O.of(undefined)
  })


  const actions = intent(sources)
  const state$ = model(actions, spread(
    inputs, {
    email$: emailInput.value$,
    name$: nameInput.value$,
    username$: usernameInput.value$,
    password$: passwordInput.value$,
    error$
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
    message$: O.merge(
      actions.submit$.withLatestFrom(state$, (_, state) => {
        const {type, name, username, email, password} = state
        return {
          type: `authorization`,
          data: {
            type: `signup`,
            data: {type: `attempt`, data: {type, name, username, email, password}}
          }
        }
      }),
      actions.facebook$.mapTo({
        type: `authorization`,
        data: {
          type: `login`,
          data: {type: `facebook`}
        }
      }),
      actions.twitter$.mapTo({
        type: `authorization`,
        data: {
          type: `login`,
          data: {type: `twitter`}
        }
      }),
      actions.github$.mapTo({
        type: `authorization`,
        data: {
          type: `login`,
          data: {type: `github`}
        }
      })
    ).map(x => {
      return x
    })
  }
}