import {nav, hr, div, a, input, form, strong, span, button} from '@cycle/dom'
import {
  renderTextPasswordField,
  renderOrSeparator,
  renderExternalButton,
  renderAlerts,
} from '../helpers'


function renderSignupButton(state) {
  return div(``, [
    button(`.appSignupButton.btn.btn-outline-crayola-orange`, {
      class: {
        disabled: !state.valid,
        "form-control": true
      },
      attrs: {
        type: `button`, 
        value: `Sign-up`, 
        disabled: !state.valid
      }
    }, ['Sign-up'])
  ])
}

function renderHaveAccountArea() {
  return div(`.switch-auth-type-area.form-group`, [
    div(`.question`, [`Already have an account?`]),
    div(`.answer`, [
      button(`.appSwitchToLoginButton.go-to-login-link`, [`Log in`])
    ])
  ])
}

// function renderExternalLinks() {
//   //return div(`.form-group`, [
//   return  //div({style: {"text-align": "center"}}, [
//       renderExternalLink(`Sign-up with Facebook`, `.appFacebookLink`)
//       // ` or `,
//       // renderExternalLink(`Twitter`, `.appTwitterLink`),
//       // ` or `,
//       // renderExternalLink(`Github`, `.appGithubLink`)
//     //])
//   //])
// }

// function renderAccountTypes(state) {
//   const individual = state.type === `individual`
//   const group = state.type === `group`

//   return div(`.form-group.account-type`, [
//     div(`.radio-inline`, [
//       input(
//         `.appAccountTypeIndividual`,
//         {attrs: {name: `type`, type: `radio`, value: `individual`, checked: individual}}),
//       `Individual`
//     ]),
//     div(`.radio-inline`, [
//       input(
//         `.appAccountTypeGroup`,
//         {attrs: {name: `type`, type: `radio`, value: `group`, checked: group}}),
//       `Performer group`
//     ])
//   ])
// }

function renderIndividualNameFields(state) {
  return [
    renderTextPasswordField(`text`, `name`, `.appDisplayName`, `Name`, state.displayName),
  ]
}


function renderBody({state, components}) {
  const {email} = state
  const errors = email.data && email.data.length &&  email.errors.length > 0 ? email.errors : []

  return div(`.signup-modal`, [
    renderAlerts(state),
    //form(attrs({action: `/auth/identity/callback`, method: `POST`}), [
      //renderAccountTypes(state),
      div(`.form-group`, [components.name]),
      div(`.form-group`, [components.username]),
      div(`.form-group`, {class: {"has-danger": errors.length}}, [
        components.email,
        errors.length? div('.form-control-feedback', [errors[0]]) : null
      ]),
      div(`.form-group`, [components.password]),
      renderSignupButton(state),
    renderOrSeparator(),
    renderExternalButton(`Sign-up with Facebook`, `.appFacebookLink.facebook-button`),
    //renderExternalLinks(),
    hr(),
    renderHaveAccountArea()
  ])
}

export default function view(state$) {
  return state$.map(state => {
    return renderBody(state)
  })
}
