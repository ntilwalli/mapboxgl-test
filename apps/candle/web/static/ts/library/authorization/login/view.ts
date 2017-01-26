import {nav, hr, div, a, input, form, strong, span, button, small} from '@cycle/dom'
import {
  combineObj
} from '../../../utils'
import {
  renderTextPasswordField,
  renderOrSeparator,
  renderExternalButton,
  renderAlerts,
} from '../helpers'


function renderLoginButton(state) {
  return div('.form-group', [
    button(`.appLoginButton.btn.btn-outline-crayola-orange`, {
      class: {
        disabled: !state.valid,
        "form-control": true
      },
      attrs: {
        type: `button`, 
        value: `Log in`, 
        disabled: !state.valid
      }
    }, ['Log-in'])
  ])
}

function renderNoAccountArea() {
  return div(`.switch-auth-type-area.form-group`, [
    div(`.question`, [`Don't have an account?`]),
    div(`.answer`, [
      button(`.appSwitchToSignupButton.go-to-signup-link`, [`Sign-up!`])
    ])
  ])
}

// function renderRememberMeForgottenPassword(state) {
//   return div(`.remember-me-area`, [
//     div(`.checkbox-inline.pull-xs-left`, [
//       input(
//         `.appRememberMe`, {
//         attrs: {type: `checkbox`, checked: state.rememberMe}
//       }),
//       `Remember me`
//     ]),
//     (`.pull-xs-right`, {attrs: {href: `#`}}, [`Forgot password?`])
//   ])
// }

function renderBody({state, components}) {
  return div(`.login-modal`, [
    state.show_errors ? renderAlerts(state) : null,
    div(`.form-group.username-section`, [
      components.username
    ]),
    div(`.mb-2.password-section`, 
      [components.password
    ]),
    button('.appForgottenButton.btn.btn-link-underline.mb-4', [
      small([
        'Forgot password?'
      ])
    ]),
    //renderRememberMeForgottenPassword(state),
    renderLoginButton(state),
    renderOrSeparator(),
    renderExternalButton(`Log in with Facebook`, `.appFacebookLink.btn.btn-outline-primary`),
    hr(),
    renderNoAccountArea()

  ])
}

export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map((inputs: any) => {
      return renderBody(inputs)
    })
}
