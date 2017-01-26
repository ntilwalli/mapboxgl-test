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
    }, ['Submit'])
  ])
}

function renderBody({state, components}) {
  return div(`.forgotten-modal`, [
    state.show_errors ? renderAlerts(state) : null,
    div('.mb-2', ['We can send you a message with password reset information']),
    div(`.form-group.email-section`, [
      components.email
    ]),
    //renderRememberMeForgottenPassword(state),
    renderSubmitButton(state)

  ])
}

export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map((inputs: any) => {
      return renderBody(inputs)
    })
}


