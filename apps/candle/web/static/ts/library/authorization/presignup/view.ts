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

// function renderSignupButton(state) {
//   return div(`.form-group`, [
//     input(
//       `.appSignUpButton.btn.btn-block.btn-primary`,
//       {attrs: {type: `button`, value: `Sign up`, disabled: !state.valid}})
//   ])
// }

// function renderAccountTypes(state) {
//   const accType = state.type
//   const individual = accType === `individual`
//   const group = state.accountType === `group`

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

function renderBody({state, components}) {

  const {email} = state
  const errors = email.data && email.data.length &&  email.errors.length > 0 ? email.errors : []
  return div(`.presignup-modal`, [
    renderAlerts(state),
    div(`.form-group`, [
      div(`.presignup-encouragement`, [
        div([`A few more pieces of info and you'll be all set.`])
      ])
    ]),
    //form(attrs({action: `/auth/presignup`, method: `POST`}), [
      //renderAccountTypes(state),
    div(`.form-group`, [components.name]),
    div(`.form-group`, [components.username]),
    div(`.form-group`, {class: {"has-danger": errors.length}}, [
      components.email,
      errors.length? div('.form-control-feedback', [errors[0]]) : null
    ]),
    renderSignupButton(state)
  ])
}

export default function view(state$) {
  return state$.debounceTime(0).map(state => {
    return renderBody(state)
  })
}
