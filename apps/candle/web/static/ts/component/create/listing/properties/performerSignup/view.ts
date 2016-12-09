import {Observable as O} from 'rxjs'
import {div, span, input, select, option} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'
import {RelativeTimeOptions as opts} from '../helpers'

function renderInPersonInput(performer_signup, components) {
  const index = performer_signup.findIndex(x => x.type === 'in-person')
  if (index >= 0) {
    const props = performer_signup[index].data
    const styles = props.styles
    return div('.column', [
      div('.row.align-center', [
        span('.sub-sub-heading.align-center', ['Begins']),
        span('.item', [components.in_person_begins]),
        span('.item.align-center', ['minutes before event start']),
      ]),
      div('.row.align-center', [
        span('.sub-sub-heading.align-center', ['Ends']),
        span(`.item`, [components.in_person_ends_time_type]),
        components.in_person_ends
      ]),
      div('.row.align-center', [
          span('.sub-sub-heading.align-center', ['Style']),
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

function renderRegistrationInput(performer_signup, components) {
  const index = performer_signup.findIndex(x => x.type === 'registration')
  const item = performer_signup[index].data
  const {type, data, begins, ends} = item
  const registration_type = type

  let renderBeginsNextLine = false
  let renderEndsNextLine = false
  if (begins.type === opts.PREVIOUS_WEEKDAY_AT_TIME) {
    renderBeginsNextLine = true
  }
  if (ends.type === opts.PREVIOUS_WEEKDAY_AT_TIME) {
    renderEndsNextLine = true
  }

  return div('.column', [
    div('.row.margin-bottom', [
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
    div('.row.align-center', [
      span('.sub-sub-heading.align-center', ['Begins']),
      span(`.item`, [components.registration_begins_time_type]),
      renderBeginsNextLine ? null : span('.item.margin-bottom', [components.registration_begins])
    ]),
    !renderBeginsNextLine ? null : div(`.column.day-time-input.margin-bottom`, [components.registration_begins]),
    div('.row.align-center.small-margin-top', [
      span('.sub-sub-heading.align-center', ['Ends']),
      span(`.item`, [components.registration_ends_time_type]),
      renderEndsNextLine ? null : span('.item.margin-bottom', [components.registration_ends])
    ]),
    !renderEndsNextLine ? null : div(`.column.day-time-input.small-margin-top`, [components.registration_ends]),
    components.registration_info ? div(`.item.small-margin-top`, [components.registration_info]) : null,
  ])
}

export default function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    })
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      const {performer_signup} = state

      const registration_checked = performer_signup.some(x => x.type === 'registration')
      const in_person_checked = performer_signup.some(x => x.type === 'in-person')

      return div('.column.performer-signup', [
        div('.sub-heading.section-heading ', ['Performer sign-up']),        
        div('.column', [
          div('.checkbox-input', [
            input('.appTypeInput', {attrs: {type: 'checkbox', name: 'signup-type', value: 'in-person', checked: in_person_checked}}, []),
            span('.title', ['In person'])
          ]),
          div('.indented.column..small-margin-top.margin-bottom', [
            renderInPersonInput(performer_signup, components),
            !in_person_checked ? div('.disabled-cover', []) : null
          ]),
          div('.checkbox-input', [
            input('.appTypeInput', {attrs: {type: 'checkbox', name: 'signup-type', value: 'registration', checked: registration_checked}}, []),
            span('.title', ['Allow pre-registration'])
          ]),
          registration_checked ? div('.indented.column.small-margin-top', {class: {"disabled-cover": !registration_checked}}, [
            renderRegistrationInput(performer_signup, components)
          ]) : null
        ])
      ])
    })
}