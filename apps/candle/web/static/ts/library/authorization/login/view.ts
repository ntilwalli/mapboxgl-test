import {nav, hr, div, a, input, form, strong, span, button} from '@cycle/dom'
import {
  renderTextPasswordField,
  renderOrSeparator,
  renderExternalButton,
  renderAlerts,
  combineObj
} from '../../../utils'


function renderLoginButton(state) {
  return div(``, [
    input(`.appLoginButton.internal-auth-button.login-button`, {
      class: {
        disabled: !state.valid
      },
      attrs: {
        type: `button`, 
        value: `Log in`, 
        disabled: !state.valid
      }
    })
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
    renderAlerts(state),
    form([
      div(`.form-group.username-section`, [components.username]),
      div(`.form-group.password-section`, [components.password]),
      //renderRememberMeForgottenPassword(state),
      renderLoginButton(state)
    ]),
    renderOrSeparator(),
    renderExternalButton(`Log in with Facebook`, `.appFacebookLink.facebook-button`),
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
