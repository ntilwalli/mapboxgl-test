import {nav, hr, div, a, input, form, strong, span, button} from '@cycle/dom'
import {
  attrs,
  renderOrSeparator,
  renderExternalLink,
  renderAlerts,
  renderTextPasswordField
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
      a(`.btn.btn-danger-outline`, attrs({href: `/?modal=login`}), [`Log in`])
    ])
  ])
}

function renderExternalLinks() {
  //return div(`.form-group`, [
  return  div({style: {"text-align": "center"}}, [
      `Sign up with `,
      renderExternalLink(`Facebook`, `.appFacebookLink`),
      ` or `,
      renderExternalLink(`Twitter`, `.appTwitterLink`),
      ` or `,
      renderExternalLink(`Github`, `.appGithubLink`)
    ])
  //])
}

function renderAccountTypes(state) {
  const individual = state.type === `individual` ? [`checked`] : null
  const group = state.type === `group` ? [`checked`] : null

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

function renderIndividualNameFields(state) {
  return [
    renderTextPasswordField(`text`, `name`, `.appDisplayName`, `Name`, state.displayName),
  ]
}


function renderBody({state, components}) {
  return div(`.signup-modal`, [
    renderAlerts(state),
    renderExternalLinks(),
    renderOrSeparator(),
    //form(attrs({action: `/auth/identity/callback`, method: `POST`}), [
    form([
      renderAccountTypes(state),
      components.name,
      components.username,
      components.email,
      components.password,
      renderSignupButton(state)
    ]),
    hr(),
    renderHaveAccountArea()
  ])
}

export default function view(state$) {
  return state$.map(state => {
    return renderBody(state)
  })
}
