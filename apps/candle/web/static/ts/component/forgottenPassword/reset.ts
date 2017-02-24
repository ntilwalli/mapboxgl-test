import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {div, span, a, button, small} from '@cycle/dom'
import {combineObj, mergeSinks, componentify, createProxy, toMessageBusMainError} from '../../utils'
import queryString = require('query-string')
import Navigator from '../../library/navigators/simple'
import ResetPasswordQuery from '../../query/resetPassword'
import TextInput from '../../library/bootstrapTextInputGated'

function intent(sources) {
  const {DOM} = sources

  return {
    submit$: DOM.select('.appResetPassword').events('click').publish().refCount(),
    to_login$: DOM.select('.appBackToLogin').events('click').publish().refCount()
  }
}

function reducers(actions, inputs) {
  const password_r = inputs.password$.map(password => state => {
    const confirm_password = state.get('confirm_password')

    if (confirm_password && !confirm_password.errors.length && confirm_password.data) {
      if (password && !password.errors.length && password.data) {
        if (password.data === confirm_password.data) {
          return state
            .set('password', password)
            .set('valid', true)
            .set('errors', [])
        } else {
          return state
            .set('password', password)
            .set('valid', false)
            .set('errors', ['Passwords do not match'])
        }
      }
    }

    return state
      .set('password', password)
      .set('valid', false)
      .set('errors', [])
  })

  const confirm_password_r = inputs.confirm_password$.map(confirm_password => state => {
    const password = state.get('password')

    if (confirm_password && !confirm_password.errors.length && confirm_password.data) {
      if (password && !password.errors.length && password.data) {
        if (password.data === confirm_password.data) {
          return state
            .set('confirm_password', confirm_password)
            .set('valid', true)
            .set('errors', [])
        } else {
          return state
            .set('confirm_password', confirm_password)
            .set('valid', false)
            .set('errors', ['Passwords do not match'])
        }
      }
    }

    return state
      .set('confirm_password', confirm_password)
      .set('valid', false)
      .set('errors', [])
  })

  const highlight_error_r = inputs.highlight_error$.skip(1).map(val => state => state.set('highlight_error', val))
  const success_r = inputs.success$.map(val => state => state.set('success', true))
  

  return O.merge(
    password_r, 
    confirm_password_r, 
    highlight_error_r,
    success_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      token$: inputs.props$
    })
    .switchMap((info: any) => {
      return reducer$.startWith(Immutable.fromJS({
        token: info.token,
        password: undefined,
        confirm_password: undefined,
        valid: false,
        highlight_error: false,
        errors: [],
        success: false
      }))
      .scan((acc, f: Function) => f(acc))
      .map((x: any) => x.toJS())
      .publishReplay(1).refCount()
    })
}

function renderForm(info: any) {
  const {state, components} = info
  const {errors, highlight_error, password, confirm_password} = state
  const main_errors = (highlight_error && errors ? errors : []).map(x => small('.red', [x]))
  const password_errors = (highlight_error && password ? password.errors : []).map(x => small('.red', [x]))
  const confirm_errors = (highlight_error && confirm_password ? confirm_password.errors : []).map(x => small('.red', [x]))

  return div('.reset-password-form', [
    div('.mb-2', main_errors),
    div('.mb-2', ['Reset your password']),
    div('.mb-1', [
      components.password,
      ...password_errors
    ]),
    div('.mb-2', [
      components.confirm_password,
      ...confirm_errors
    ]),
    button('.appResetPassword', 
    //{attrs: {disabled: !info.state.valid}}, 
    ['Reset'])
  ])
}

function view(state$, components) {
  return combineObj({
    state$, 
    components$: combineObj(components)
  })
    .map((info: any) => {
      const {state, components} = info
      return div('.forgotten-password-reset', [
        components.navigator,
        state.success ? div('.mb-4', [
          div(['Password reset successfully']),
          button('.appBackToLogin.btn.btn-link', ['Back to login'])
        ]) : renderForm(info)
      ])
    })
}

function genericValidator(input, f, empty_is_error) {
  if (!input && !empty_is_error) {
    return {
      value: input,
      errors: []
    }
  } else if (input) {
    if (!input.length && !empty_is_error) {
      return {
        value: input,
        errors: []
      }
    } else if (input.length) {
      return f(input)
    } else {
      return  {
        value: input,
        errors: ['Cannot be empty']
      }
    }
  } else {
    return {
      value: input,
      errors: ['Cannot be empty']
    }
  }
}

const passwordTest = input => {
  if (input.length >= 8) {
    return {
      value: input,
      errors: []
    }
  } else {
    return {
      value: input,
      errors: ['Password must be at least 8 characters']
    }
  }
}

function makePasswordValidator(empty_is_error = true) {
  return function(input) {
    return genericValidator(input, passwordTest, empty_is_error)
  }
}

const password_input_props = {
  type: 'password',
  placeholder: `New password`,
  name: `password`,
  style_class: `.password-input.form-control`,
  empty_is_error: true
}

const confirm_password_input_props = {
  type: 'password',
  placeholder: `Confirm new password`,
  name: `password`,
  style_class: `.password-input.form-control`,
  empty_is_error: true
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const highlight_error$ = actions.submit$.mapTo(true).startWith(false).publishReplay(1).refCount()
  const password = isolate(TextInput)(sources, {
    validator: makePasswordValidator(password_input_props.empty_is_error),
    props$: O.of(password_input_props),
    initialText$: O.of(undefined),
    highlight_error$
  })

  const confirm_password = isolate(TextInput)(sources, {
    validator: x => ({value: x, errors: []}),
    props$: O.of(confirm_password_input_props),
    initialText$: O.of(undefined),
    highlight_error$
  })

  const success$ = createProxy()
  const state$ = model(actions, {
    ...inputs, 
    password$: password.output$, 
    confirm_password$: confirm_password.output$,
    highlight_error$,
    success$
  })

  const navigator = Navigator(sources, inputs)


  const components = {
    navigator: navigator.DOM,
    password: password.DOM,
    confirm_password: confirm_password.DOM
  }

  const vtree$ = view(state$, components)
  const reset_password_query = ResetPasswordQuery(sources, {
    props$: actions.submit$
      .withLatestFrom(state$, (_, state: any) => {
        return state
      })
      .filter((state: any) => state.valid)
      .map((state: any) => {
        return {
          token: state.token,
          password: state.password.data
        }
      })
  })

  const to_storage$ = O.of({
    action: 'removeItem',
    key: 'forgotten_password_token'
  })

  success$.attach(reset_password_query.success$)

  const merged = mergeSinks(navigator, reset_password_query)
  return {
    ...merged,
    DOM: vtree$,
    Storage: O.merge(
      merged.Storage,
      to_storage$
    ),
    Global: actions.to_login$.mapTo({
        data: '/?modal=login',
        type: 'redirect'
      }),
    Router: O.merge(
      merged.Router
    ),
    MessageBus: O.merge(
      merged.MessageBus,
      reset_password_query.error$.map(toMessageBusMainError)
    )
  }
}

