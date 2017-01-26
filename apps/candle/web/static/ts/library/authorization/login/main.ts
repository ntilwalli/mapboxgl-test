import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'

import view from './view'
import intent from './intent'
import model from './model'

import {combineObj, createProxy, spread} from '../../../utils'
//import TextInput from '../../textInput'
//import TextInput, {SmartTextInputValidation} from '../../smartTextInput'
import TextInput, {SmartTextInputValidation} from '../../bootstrapTextInputGated'

const validator = x => ({value: x, errors: []})

const username_input_props = O.of({
  placeholder: `Username`,
  name: `username`,
  autofocus: true,
  //required: true,
  style_class: `.auth-input`,
  // key: `login`
  empty_is_error: true
})

const password_input_props = O.of({
  type: `password`,
  placeholder: `Password`,
  name: `password`,
  //required: true,
  style_class: `.auth-input`,
  // key: `login`
  empty_is_error: true
})

const BACKEND_URL = `/api_auth/login`

export default function main(sources, inputs) {

  const error$ = sources.MessageBus.address(`/modal/login`)
    .do(x => console.log(`bus message:`, x))
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .publishReplay(1).refCount()

  const highlight_error$ = createProxy()

  const username_input = isolate(TextInput)(sources, {
    validator,
    props$: username_input_props, 
    initial_text$: O.of(undefined), 
    highlight_error$
  })

  const password_input = isolate(TextInput)(sources, {
    validator,
    props$: password_input_props, 
    initial_text$: O.of(undefined),
    highlight_error$
  })

  const actions = intent(sources)
  const state$ = model(actions, {
    ...inputs, 
    username$: username_input.output$,
    password$: password_input.output$,
    error$
  })

  highlight_error$.attach(state$.pluck('show_errors').distinctUntilChanged())

  const vtree$ = view(state$, {
    username$: username_input.DOM,
    password$: password_input.DOM
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
        }),
      actions.forgotten$.withLatestFrom(state$, (_, state) => {
          return {to: `main`, message: {type: `showForgotten`, data: state.props}}
        })
    )
    //.do(x => console.log(`login message`, x))
  }
}
