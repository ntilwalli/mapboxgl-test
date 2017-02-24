import {nav, hr, div, a, input, form, strong, span, button} from '@cycle/dom'
import {
  combineObj
} from '../../../utils'
import {
  renderTextPasswordField,
  renderOrSeparator,
  renderExternalButton,
  renderAlerts,
} from '../helpers'

import {renderSKFadingCircle6} from '../../spinners'


function renderSubmitButton(state) {
  return div('.form-group', [
    button('.appSubmitForgottenEmailButton.btn.btn-outline-crayola-orange', {
      class: {
        disabled: !state.valid,
        "form-control": true
      },
      attrs: {
        type: `button`, 
        value: `submit`, 
        disabled: !state.valid
      }
    }, [state.waiting ? div('.d-flex.justify-content-center', [renderSKFadingCircle6()]) : 'Submit'])
  ])
}

function renderSuccess(state) {
  //console.log('Success forgotten password state', state)
  return div(['Check your email for a password reset link!'])
}

function renderError(state) {
  //console.log('Error forgotten password state', state)
  return div(['Check your email for a password reset link!'])
}

function renderBody({state, components}) {
  return div(`.forgotten-modal`, [
    //state.show_errors ? renderAlerts(state) : null,
    state.status && state.status.type === 'error' ? renderError(state) : null,
    !state.status || state.status.type === 'error' ? div('.forgotten-password-input-area', [
      div('.mb-2', ['We can send you a message with password reset information']),
      div(`.form-group.email-section`, [
        components.email
      ])
    ]) : renderSuccess(state),
    //renderRememberMeForgottenPassword(state),
    !state.status || state.status.type === 'error' ? renderSubmitButton(state) : null

  ])
}

export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map((inputs: any) => {
      return renderBody(inputs)
    })
}


