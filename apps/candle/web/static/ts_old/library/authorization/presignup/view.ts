import {nav, hr, div, a, input, form, strong, span, button} from '@cycle/dom'
import {
  attrs,
  renderTextPasswordField,
  renderOrSeparator,
  renderAlerts
} from '../../../utils'


function renderSignupButton(state) {
  return div(`.form-group`, [
    input(
      `.appSignUpButton.btn.btn-block.btn-primary`,
      attrs({type: `button`, value: `Sign up`}, !state.valid ? [`disabled`] : []))
  ])
}

function renderHaveAccountArea() {
  return div(`.switch-auth-type-area.form-group`, [
    div(`.question`, [`Already have an account?`]),
    div(`.answer`, [
      a(`.btn.btn-danger-outline`, attrs({href: `/login`}), [`Log in`])
    ])
  ])
}

function renderExternalLinks() {
  return div(`.form-group`, [
    div({style: {"text-align": "center"}}, [
      `Sign up with `,
      a(attrs({href: `#`}), [`Facebook`]),
      ` or `,
      a(attrs({href: `#`}), [`Twitter`]),
      ` or `,
      a(attrs({href: `#`}), [`Github`]),
    ])
  ])
}

function renderAccountTypes(state) {
  const accType = state.type
  const individual = accType === `individual` ? [`checked`] : null
  const group = state.accountType === `group` ? [`checked`] : null

  return div(`.form-group.account-type`, [
    div(`.radio-inline`, [
      input(
        `.appAccountTypeIndividual`,
        attrs({name: `type`, type: `radio`, value: `individual`}, individual)),
      `Individual`
    ]),
    div(`.radio-inline`, [
      input(
        `.appAccountTypeGroup`,
        attrs({name: `type`, type: `radio`, value: `group`}, group)),
      `Performer group`
    ])
  ])
}

function renderBody({state, components}) {
  return div(`.presignup-modal`, [
    renderAlerts(state),
    div(`.form-group`, [
      div(`.presignup-encouragement`, [
        div([`This is your first time authenticating with that account...`]),
        div([`A few more pieces of info and you'll be all set.`])
      ])
    ]),
    //form(attrs({action: `/auth/presignup`, method: `POST`}), [
    form([
      renderAccountTypes(state),
      components.name,
      components.username,
      components.email,
      renderSignupButton(state)
    ])
  ])
}

export default function view(state$) {
  return state$.map(state => {
    return renderBody(state)
  })
}
