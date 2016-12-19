import {div, input, span, hr, button} from '@cycle/dom'

export function renderTextPasswordField(type, name, cssClass, placeholder, value) {
  return div(`.form-group`, [
    input(`${cssClass}.form-control`, {attrs: {type, placeholder, name, value: value ? value : ``}})
  ])
}

export function renderOrSeparator() {
  return div(`.signup-or-separator.form-group`, [
    span(`.h6.signup-or-separator--text.flex-center`, [`or`]),
    hr()
  ])
}

export function renderExternalButton(text, cssClass) {
  const c = cssClass ? cssClass : ``
  return div(`.form-group`, [
    button(`${c}.form-control`, {attrs: {type: 'button'}}, [text])
  ])
}

export function renderExternalLink(text, cssClass) {
  const c = cssClass ? cssClass : ``
  return button(`${c}`, [text])
}

export function renderAlerts(state) {
  return state.errors.length ? div(`.form-group`, [
    div(`.alerts-area`, state.errors.map(err => div(`.alert.alert-danger`, [err])))
  ]) : null
}