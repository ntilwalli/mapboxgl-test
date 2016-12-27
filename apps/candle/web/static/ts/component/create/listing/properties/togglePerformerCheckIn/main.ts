import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, label, span, input, h6} from '@cycle/dom'
import {combineObj} from '../../../../../utils'
import {PerformerSignupOptions, PreRegistrationOptions} from '../../../../../listingTypes'
import {BlankStructuredUndefined} from '../helpers'
import {default as CheckIn, getDefault as getCheckInDefault} from '../performerCheckIn/main'
import clone = require('clone')

export function getDefault() {
  const out: any = getCheckInDefault()
  out['enable_in_app'] = false
  return out
}

function InAppCheckboxComponent(sources, props$) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const checked$ = O.merge(
    shared$,
    sources.DOM.select('.appInAppCheckInCheckbox').events('click').map(ev => !!ev.target.checked)
  )

  const vtree$ = shared$.map(props => {

    return div('.row', [
      span('.col-xs-12.raw-line', [
        span('.content', [
          label('.form-check-inline', [
            input('.appInAppCheckInCheckbox.form-check-input', {attrs: {type: 'checkbox', name: 'in-app-checkin', value: 'app', checked: props === true}}, []),
            'Enable in-app'
          ])
        ])
      ])
    ])
  })

  return {
    DOM: vtree$,
    output$: checked$
  }
}

function enable_check_in(prop) {
  if (prop) {
    switch (prop.type) {
      case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
      case PerformerSignupOptions.PRE_REGISTRATION:
        return true
      default:
        return false
    }
  }

  return false
}

function should_enable_in_app(prop) {
  if (prop && prop.data.pre_registration.type === PreRegistrationOptions.APP)
    return true
  else
    return false
}

const toComponent = (component$) => {
  return {
    DOM: component$.switchMap(x => x.DOM),
    output$: component$.switchMap(x => x.output$)
  }
}

function EnabledComponent(sources, inputs, session) {

  const performer_check_in = session.listing.meta.performer_check_in
  const performer_check_in_component = CheckIn(sources, {...inputs, props$: O.of(performer_check_in)})

  const should_enable_in_app$ = inputs.session$
    .map(x => clone(x.listing.meta))
    .distinctUntilChanged((x: any, y: any) => {
      const x_props = x.performer_sign_up
      const y_props = y.performer_sign_up
      return should_enable_in_app(x_props) === should_enable_in_app(y_props)
    })
    .map(x => should_enable_in_app(x.performer_sign_up))
    .publishReplay(1).refCount()

  const in_app_component = InAppCheckboxComponent(sources, O.of(performer_check_in ? performer_check_in.enable_in_app : undefined))            
  
  const vtree$ = combineObj({
      should_enable_in_app: should_enable_in_app$,
      check_in: performer_check_in_component.DOM,
      in_app: in_app_component.DOM
    }).debounceTime(0).map((components: any) => {
      const {should_enable_in_app, check_in, in_app} = components

    return div('.card.card-block', [
      h6('.card-title', ['Performer check-in']),
        check_in,
        div('.row', {class: {disabled: !should_enable_in_app}}, [
          div('.col-xs-12', [
            in_app
          ])
        ])
      ])
    })

  const output$ = combineObj({
      should_enable_in_app: should_enable_in_app$,
      check_in: performer_check_in_component.output$,
      in_app: in_app_component.output$
    }).debounceTime(0).map((info: any) => {
      const {check_in, in_app} = info
      return {
        data: {
          ...check_in.data,
          enable_in_app: should_enable_in_app ? in_app : undefined
        },
        valid: check_in.valid,
        errors: check_in.errors
      }
    })

  return {
    DOM: vtree$,
    output$
  }
}

function DisabledComponent(sources, inputs) {
  return {
    // DOM: O.of(div('.column', [
    //   div('.sub-heading.section-heading ', ['Performer check-in']),
    //   div('.row', [
    //     span('.flex.align-center', ['Performer check-in disabled, requires enabling pre-registration sign-up.'])
    //   ])
    // ])),
    DOM: O.of(undefined),
    output$: O.of({
      data: undefined,
      valid: true,
      errors: []
    })
  }
}

export default function main(sources, inputs) {
  // const shared$ = inputs.props$
  //   .map(x => x || getDefault())
  //   .publishReplay(1).refCount()

  const component$ = inputs.session$
    .filter(session => {
      return !!session.listing.meta.performer_sign_up
    })
    .distinctUntilChanged((x: any, y: any) => {
      const x_props = x.listing.meta.performer_sign_up
      const y_props = y.listing.meta.performer_sign_up
      return enable_check_in(x_props) === enable_check_in(y_props)
    })
    .map(session => {
      const performer_sign_up = session.listing.meta.performer_sign_up
      if (enable_check_in(performer_sign_up)) {
        return EnabledComponent(sources, inputs, session)
      } else {
        return DisabledComponent(sources, inputs)
      }
    }).publishReplay(1).refCount()


  return toComponent(component$)
}