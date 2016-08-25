import {nav, hr, div, a, input, form, strong, span, button} from '@cycle/dom'
import {
  attrs,
  renderTextPasswordField,
  renderOrSeparator,
  renderExternalButton,
  renderAlerts,
  renderModal,
  combineObj
} from '../../../utils'


function renderLoginButton(state) {
  return div(`.form-group`, [
    input(
      `.appLoginButton.btn.btn-block.btn-primary`,
      attrs({type: `button`, value: `Log in`}, !state.valid ? [`disabled`] : []))
  ])
}

function renderNoAccountArea() {
  return div(`.switch-auth-type-area.form-group`, [
    div(`.question`, [`Don't have an account?`]),
    div(`.answer`, [
      a(`.btn.btn-danger-outline`, attrs({href: `/?modal=signup`}), [`Sign up`])
    ])
  ])
}

function renderRememberMeForgottenPassword(state) {
  return div(`.form-group.remember-me`, [
    div(`.checkbox-inline.pull-xs-left`, [
      input(
        `.appRememberMe`,
        attrs({type: `checkbox`}, state.rememberMe ? [`checked`] : null)
      ),
      `Remember me`
    ]),
    a(`.pull-xs-right`, attrs({href: `#`}), [`Forgot password?`])
  ])
}

function renderBody({state, components}) {
  return div(`.login-modal`, [
    renderAlerts(state),
    renderExternalButton(`Log in with Twitter`, `.appTwitterLink`),
    renderExternalButton(`Log in with Facebook`, `.appFacebookLink`),
    renderExternalButton(`Log in with Github`, `.appGithubLink`),
    renderOrSeparator(),
    form(attrs({action: `/auth/identity/callback`, method: `POST`}), [
      components.username,
      components.password,
      renderRememberMeForgottenPassword(state),
      renderLoginButton(state)
    ]),
    hr(),
    renderNoAccountArea()
  ])
}

export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map(inputs => {
      return renderBody(inputs)
    })
}
