import {Observable as O} from 'rxjs'
import {div, span, input, select, option} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'


function renderRegistrationTypeWebsite(data) {
  return null
}

function renderRegistrationTypeEmail(data) {
  return null
}

function renderRegistrationTypeApp(data) {
  return null
}

function renderTimeComboBox(props, components) {
  const {begins} = props
  const {type, data} = begins

  return div(`.item`, [
    input({attrs: {type: 'text'}}), span(['before event'])
    // select(`.appInPersonBegins`, [
    //   option({
    //       attrs: {
    //         value: undefined, 
    //         selected: !type
    //       }
    //     }, [``]),
    //   option({
    //       attrs: {
    //         value: `weekly`,
    //         selected: type === `weekly`
    //       }
    //     }, [`Weekly`]),
    //   option({
    //       attrs: {
    //         value: `monthly`, 
    //         selected: freq === `monthly`
    //       }
    //     }, [`Monthly`])
    // ])
  ])
}

function renderInPersonInput(performer_signup, components) {
  const index = performer_signup.findIndex(x => x.type === 'in-person')
  if (index >= 0) {
    const props = performer_signup[index].data
    const styles = props.styles
    return div('.column.margin-bottom', [
      div('.row.align-center.small-margin-bottom', [
        span('.sub-heading.align-center', ['Begins']),
        span('.item', [components.in_person_begins]),
        span('.item.align-center', ['minutes before event start']),
      ]),
      div('.row.align-center.small-margin-bottom', [
        span('.sub-heading.align-center', ['Ends']),
        span(`.item`, [components.in_person_ends_time_type]),
        components.in_person_ends
      ]),
      div('.row.align-center', [
          span('.sub-heading.align-center', ['Style']),
          div('.checkbox-input', [
            input('.appInPersonStyleInput', {attrs: {type: 'checkbox', name: 'in-person-style', value: 'bucket', checked: styles.some(x => x === 'bucket')}}, []),
            span('.title', ['Bucket'])
          ]),
          div('.checkbox-input', [
            input('.appInPersonStyleInput', {attrs: {type: 'checkbox', name: 'in-person-style', value: 'list', checked: styles.some(x => x === 'list')}}, []),
            span(`.title`, ['List'])
          ])
        ])
      ])
  } else {
    return null
  }  
}

function renderRegistrationInput(performer_signup) {
  const index = performer_signup.findIndex(x => x.type === 'registration')
  let registration_input = null
  let registration_type = undefined
  if (index >= 0) {
    const item = performer_signup[index].data
    if (item) {
      const {type, data} = item
      const registration_type = type
      if (registration_type === 'app') {
        registration_input = renderRegistrationTypeApp(data)
      } else if (registration_type === 'email') {
        registration_input = renderRegistrationTypeEmail(data)
      } else if (registration_type === 'website') {
        registration_input = renderRegistrationTypeWebsite(data)
      } else {
        throw new Error(`Invalid registration input type: ${type}`)
      }
    }
  }

  return div('.column', [
    div('.row', [
      div('.radio-input', [
        input('.appRegistrationTypeInput', {attrs: {type: 'radio', name: 'registration-type', value: 'app', checked: registration_type === 'app'}}, []),
        span('.title', ['Enable in-app'])
      ]),
      div('.radio-input', [
        input('.appRegistrationTypeInput', {attrs: {type: 'radio', name: 'registration-type', value: 'email', checked: registration_type === 'email'}}, []),
        span(`.title`, ['E-mail'])
      ]),
      div('.radio-input', [
        input('.appRegistrationTypeInput', {attrs: {type: 'radio', name: 'registration-type', value: 'website', checked: registration_type === 'website'}}, []),
        span('.title', ['Website'])
      ])
    ]),
    registration_input
  ])
}

export default function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    }).map((info: any) => {
      const {state, components} = info
      const {performer_signup} = state

      const registration_checked = performer_signup.some(x => x.type === 'registration')
      const in_person_checked = performer_signup.some(x => x.type === 'in-person')

      return div('.column', [
        div('.sub-heading', ['Performer sign-up']),        
        div('.column', [
          div('.checkbox-input', [
            input('.appTypeInput', {attrs: {type: 'checkbox', name: 'signup-type', value: 'in-person', checked: in_person_checked}}, []),
            span('.title', ['In person'])
          ]),
          div('.indented.column', [
            renderInPersonInput(performer_signup, components),
            !in_person_checked ? div('.disabled-cover', []) : null
          ]),
          div('.checkbox-input', [
            input('.appTypeInput', {attrs: {type: 'checkbox', name: 'signup-type', value: 'registration', checked: registration_checked}}, []),
            span('.title', ['Allow pre-registration'])
          ]),
          div('.indented.column', {class: {"disabled-cover": !registration_checked}}, [
            renderRegistrationInput(performer_signup)
          ])
        ])
      ])
    })
}