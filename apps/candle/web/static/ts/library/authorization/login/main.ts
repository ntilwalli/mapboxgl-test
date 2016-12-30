import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'

import view from './view'
import intent from './intent'
import model from './model'

import {combineObj, spread} from '../../../utils'
//import TextInput from '../../textInput'
//import TextInput, {SmartTextInputValidation} from '../../smartTextInput'
import TextInput, {SmartTextInputValidation} from '../../bootstrapTextInput'

const validator = x => ({value: x, errors: []})

const usernameInputProps = O.of({
  placeholder: `Username`,
  name: `username`,
  autofocus: true,
  //required: true,
  styleClass: `.auth-input`,
  // key: `login`
  emptyIsError: true
})

const passwordInputProps = O.of({
  type: `password`,
  placeholder: `Password`,
  name: `password`,
  //required: true,
  styleClass: `.auth-input`,
  // key: `login`
  emptyIsError: true
})

const BACKEND_URL = `/api_auth/login`

export default function main(sources, inputs) {

  const error$ = sources.MessageBus.address(`/modal/login`)
    .do(x => console.log(`bus message:`, x))
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .publishReplay(1).refCount()

  const usernameInput = TextInput(sources, {
    validator,
    props$: usernameInputProps, 
    initialText$: O.of(undefined)
  })

  const passwordInput = TextInput(sources, {
    validator,
    props$: passwordInputProps, 
    initialText$: O.of(undefined)
  })

  const actions = intent(sources)
  const state$ = model(actions, spread(
    inputs, {
    username$: usernameInput.output$,
    password$: passwordInput.output$,
    error$
  }))

  const vtree$ = view(state$, {
    username$: usernameInput.DOM,
    password$: passwordInput.DOM
  })

  return {
    DOM: vtree$,
    MessageBus: O.merge(
      O.merge(
        actions.facebook$.withLatestFrom(state$, (_, state) => {
          return ({type: `facebook`, data: state.props})
        }),
        actions.twitter$.withLatestFrom(state$, (_, state) => {
          return ({type: `twitter`, data: state.props})
        }),
        actions.github$.withLatestFrom(state$, (_, state) => {
          return ({type: `github`, data: state.props})
        }),
        actions.submit$.withLatestFrom(state$, (_, state) => {
          const {username, password} = state
          return {
            type: `local`,
            data: {username: username.data, password: password.data, data: state.props}
          }
        })
      ).map(x => ({to: `/authorization/login`, message: x})),
      actions.signup$.withLatestFrom(state$, (_, state) => {
          return {to: `main`, message: {type: `showSignup`, data: state.props}}
        })
    )
    //.do(x => console.log(`login message`, x))
  }
}
