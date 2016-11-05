import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'

import view from './view'
import intent from './intent'
import model from './model'

import {combineObj, spread} from '../../../utils'
import TextInput from '../../textInput'

const usernameInputProps = O.of({
  placeholder: `Username`,
  name: `username`,
  required: true,
  key: `login`
})

const passwordInputProps = O.of({
  type: `password`,
  placeholder: `Password`,
  name: `password`,
  required: true,
  key: `login`
})

const BACKEND_URL = `/api_auth/login`

export default function main(sources, inputs) {

  const error$ = inputs.message$
    .filter(x => x.type === `authorization`)
    .map(x => x.data)
    .filter(x => x.type === `login`)
    .map(x => x.data)
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .publishReplay(1).refCount()

  const usernameInput = TextInput(sources, {
    props$: usernameInputProps, 
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
    username$: usernameInput.value$,
    password$: passwordInput.value$,
    error$
  }))

  const vtree$ = view(state$, {
    username$: usernameInput.DOM,
    password$: passwordInput.DOM
  })

  return {
    DOM: vtree$,
    message$: O.merge(
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
      }),
      actions.submit$.withLatestFrom(state$, (_, state) => {
        const {username, password} = state
        return {
          type: `authorization`,
          data: {
            type: `login`,
            data: {
              type: `local`,
              data: {username, password}
            }
          }
        }
      })
    )
  }
}
