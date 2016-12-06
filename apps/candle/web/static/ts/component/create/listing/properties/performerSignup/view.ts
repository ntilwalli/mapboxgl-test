import {Observable as O} from 'rxjs'
import {div, span, input} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'

function renderTypeWebsite(data) {
  return null
}

function renderTypeEmail(data) {
  return null
}

function renderTypeApp(data) {
  return null
}

function renderInPersonInput(performer_signup) {
  const index = performer_signup.find(x => x.type === 'in-person')

  if (index >= 0) {
    return div('.input-section', [
      'Hello'
    ])
  } else {
    return null
  }  
}

function renderRegistrationInput(performer_signup) {
  const index = performer_signup.find(x => x.type === 'register')
  let registration_input
  if (index) {
    const {type, data} = performer_signup[index].data
    if (type === 'app') {
      registration_input = renderTypeApp(data)
    } else if (type === 'email') {
      registration_input = renderTypeEmail(data)
    } else if (type === 'website') {
      registration_input = renderTypeWebsite(data)
    } else {
      throw new Error(`Invalid registration input type: ${type}`)
    }
  } else {
    return null
  }

  return div('.input-section', [
    div('.row-input-section', [
      div('.radio-input', [
        input('.appRegistrationTypeInput', {attrs: {type: 'radio', name: 'registration-type', value: 'app', checked: performer_signup.some(x => x.type === 'app')}}, []),
        span('.title', ['App'])
      ]),
      div('.radio-input', [
        input('.appRegistrationTypeInput', {attrs: {type: 'radio', name: 'registration-type', value: 'email', checked: performer_signup.some(x => x.type === 'email')}}, []),
        span(`.title`, ['E-mail'])
      ]),
      div('.radio-input', [
        input('.appRegistrationTypeInput', {attrs: {type: 'radio', name: 'registration-type', value: 'website', checked: performer_signup.some(x => x.type === 'website')}}, []),
        span('.title', ['Website'])
      ])
    ]),
    registration_input
  ])
}

export default function view(state$, components) {
  return combineObj({
      state$//,
      //components: combineObj(components)
    }).map((info: any) => {
      const {state} = info
      const {performer_signup} = state

      const types = performer_signup.map(x => x.type)
      const registration_checked = types.some(x => x === 'registration')
      const in_person_checked = types.some(x => x === 'in-person')

      return div('.left-row-input-section', [
        div('.left-sub-heading', ['Performer sign-up']),        
        div('.input-area', [
          div('.checkbox-input', [
            input('.appTypeInput', {attrs: {type: 'checkbox', name: 'signup-type', value: 'in-person', checked: in_person_checked}}, []),
            span('.title', ['In person'])
          ]),
          div('.indented.input-area', [
            renderInPersonInput(performer_signup),
            !in_person_checked ? div('.disabled-cover', []) : null
          ]),
          div('.checkbox-input', [
            input('.appTypeInput', {attrs: {type: 'checkbox', name: 'signup-type', value: 'registration', checked: registration_checked}}, []),
            span('.title', ['Allow pre-registration'])
          ]),
          div('.indented.input-area', [
            renderRegistrationInput(performer_signup),
            !registration_checked ? div('.disabled-cover', []) : null
          ])
        ])
      ])
    })
}