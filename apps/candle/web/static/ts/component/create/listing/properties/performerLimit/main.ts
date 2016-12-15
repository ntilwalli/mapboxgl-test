import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import {combineObj, createProxy, traceStartStop} from '../../../../../utils'
import { ComboBox, BlankUndefined, BlankStructuredUndefined, NumberInputComponent} from '../helpers'
import {MetaPropertyTypes, PerformerSignupOptions, PerformerLimitOptions} from '../../helpers'
import clone = require('clone')




function PerformerLimitComboBox(sources, props$) {
  const options = [
    PerformerLimitOptions.NO_LIMIT,
    PerformerLimitOptions.LIMIT,
    PerformerLimitOptions.LIMIT_BY_SIGN_UP_TYPE
  ]

  return isolate(ComboBox)(sources, options, props$)
}

function PerformerLimitByTypeComboBox(sources, props$) {
  const options = [
    PerformerLimitOptions.NO_LIMIT,
    PerformerLimitOptions.LIMIT
  ]

  return isolate(ComboBox)(sources, options, props$)
}

function NumberOfPeopleComponent(sources, props$, component_id) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const message = component_id + ': Invalid number'
  const input = NumberInputComponent(sources, shared$.map(x => x.toString()), message)

  const vtree$ = input.DOM.map((input: any) => {
    return div('.row', [
      span('.item', [input]),
      span('.flex.align-center', ['people'])
    ])
  })

  return {
    DOM: vtree$,
    output$: input.output$
  }
}

function EnableWaitlistComponent(sources, props$) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const checked$ = O.merge(
    shared$,
    sources.DOM.select('.appCheckbox').events('click').map(ev => !!ev.target.checked)
  )

  const vtree$ = shared$.map(props => {
    return div('.row', [
      span('.item', [
        input('.appCheckbox', {attrs: {type: 'checkbox', checked: props === true}}, [])
      ]),
      span(['Enable in-app waitlist'])
    ])
  })

  return {
    DOM: vtree$,
    output$: checked$
  }
}

function ByTypeComponent(sources, props$, component_id) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const toDefaultValue = type => {
    switch (type) {
      case PerformerLimitOptions.LIMIT:
        return {type, data: 25}
      default: 
        return {type, data: undefined}
    }
  }

  const type_combo = isolate(PerformerLimitByTypeComboBox)(sources, shared$.pluck('type'))
  const type$ = type_combo.output$.publishReplay(1).refCount() 
  const input$ = O.merge(
      shared$, 
      type$.skip(1).map(toDefaultValue)
    )
    .map((props: any) => {
      switch (props.type) {
        case PerformerLimitOptions.LIMIT:
          return NumberOfPeopleComponent(sources, O.of(props.data), component_id)
        default: 
          return BlankStructuredUndefined()
      }
    }).publishReplay(1).refCount()

  const input_component = {
    DOM: input$.switchMap(x => x.DOM),
    output$: input$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
    type: type_combo.DOM, 
    data: input_component.DOM
  }).debounceTime(0).map((components: any) => {
    return div('.row', [
      div('.item', [components.type]),
      components.data
    ])
  })

  const output$ = combineObj({
    type$,
    input: input_component.output$
  }).debounceTime(0).map((components: any) => {
    return {
      ...components.input,
      data: {
        type: components.type,
        data: components.input.data
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

function LimitByTypeComponent(sources, props$, in_app_enabled$, component_id) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const in_person = isolate(ByTypeComponent)(sources, shared$.pluck('in_person'), 'In person limit')
  const pre_registration = isolate(ByTypeComponent)(sources, shared$.pluck('pre_registration'), 'Pre-registration limit')

  const components_output$ = combineObj({
    in_person: in_person.output$,
    pre_registration: pre_registration.output$
  }).map((components: any) => {
    const {in_person, pre_registration} = components
    const valid = in_person.valid && pre_registration.valid
    const errors = in_person.errors.concat(pre_registration.errors)
    return {
      data: {
        in_person: in_person.data,
        pre_registration: pre_registration.data
      },
      valid,
      errors
    }
  }).publishReplay(1).refCount()


  const shouldEnable = state => {
    const {in_person, pre_registration} = state
    return [in_person.type, pre_registration.type].every(x => x === PerformerLimitOptions.LIMIT)
  }

  const enable_waitlist$ = combineObj({
    state: O.merge(
      shared$.pluck('data'),
      components_output$.pluck('data')
    ),
    in_app_enabled$
  }).debounceTime(0).map((info: any) => {
    if (info.in_app_enabled && info.state && shouldEnable(info.state)) {
      return EnableWaitlistComponent(sources, O.of(info.state.enable_waitlist)) 
    } else {
      return BlankUndefined()
    }
  }).publishReplay(1).refCount()

  const enable_waitlist = {
    DOM: enable_waitlist$.switchMap(x => x.DOM),
    output$: enable_waitlist$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
    in_person: in_person.DOM, 
    pre_registration: pre_registration.DOM,
    enable_waitlist: enable_waitlist.DOM
  }).debounceTime(0).map((components: any) => {
    return div('.column', [
      div('.row', [
        span('.sub-sub-heading.item.flex.align-center', ['In-person']),
        components.in_person
      ]),
      div('.row', [
        span('.sub-sub-heading.item.flex.align-center', ['Pre-registration']),
        components.pre_registration
      ]),
      components.enable_waitlist
    ])
  })

  const output$ = combineObj({
    components: components_output$,
    enable_waitlist: enable_waitlist.output$
  }).debounceTime(0).map((info: any) => {
    const {components, enable_waitlist} = info
    return {
      ...components,
      data: {
        ...components.data,
        enable_waitlist: !!enable_waitlist
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

function LimitComponent(sources, props$, in_app_enabled$, component_id) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const message = component_id
  const input = NumberOfPeopleComponent(sources, shared$.map(x => x.limit.toString()), message)

  const enable_waitlist$ = in_app_enabled$.map(val => {
    if (val) {
      return EnableWaitlistComponent(
        sources, 
        O.of(shared$.map(x => x.enable_waitlist)
      ))
    } else {
      return BlankUndefined()
    }
  }).publishReplay(1).refCount()

  const enable_waitlist = {
    DOM: enable_waitlist$.switchMap(x => x.DOM), 
    output$: enable_waitlist$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
    input: input.DOM, 
    enable_waitlist: enable_waitlist.DOM
  }).debounceTime(0).map((components: any) => {
    const {input, enable_waitlist} = components
    return div('.column', [
      input,
      enable_waitlist
    ])
  })

  const output$ = combineObj({
    input: input.output$,
    enable_waitlist: enable_waitlist.output$
  }).debounceTime(0).map((info: any) => {
    const {input, enable_waitlist} = info
    return {
      ...input,
      data: {
        limit: input.data,
        enable_waitlist
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}

const opts = PerformerLimitOptions

function getNoLimitDefault() {
  return undefined
}

function getLimitDefault() {
  return {
    limit: 25,
    enable_waitlist: false
  }
}

function getLimitByTypeDefault() {
  return {
    in_person: {
      type: opts.LIMIT,
      data: 5 
    },
    pre_registration: {
      type: opts.LIMIT,
      data: 10
    },
    enable_waitlist: false
  }
}

function toProps(type) {

      if (type === opts.NO_LIMIT) {
        return {
          type,
          data: getNoLimitDefault()
        }
      } else if (type === opts.LIMIT) {
        return {
          type,
          data: getLimitDefault()
        } 
      } else if (type === opts.LIMIT_BY_SIGN_UP_TYPE) {
        return {
          type,
          data: getLimitByTypeDefault()
        }
      } 
}

export function getDefault() {
  return toProps(opts.NO_LIMIT)
}

export default function main(sources, inputs) {
  const shared$ = inputs.props$.take(1)
    .map(props => props || getDefault())
    .publishReplay(1).refCount()

  //const in_app_enabled$ = O.of(inputs.can_offer_waitlist)
  const in_app_enabled$ = inputs.session$
    .map(session => {
      const performer_sign_up = session.listing.meta.performer_sign_up 
      return !!(
        performer_sign_up && 
        (performer_sign_up.type === PerformerSignupOptions.PRE_REGISTRATION || 
          performer_sign_up.type === PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION) && 
        performer_sign_up.data.pre_registration.type === 'app'
      )
    })
    .distinctUntilChanged()
    .letBind(traceStartStop('in_app_enabled trace'))
    .publishReplay(1).refCount()

  const limit_type_component = PerformerLimitComboBox(sources, shared$.pluck('type'))
  const limit_type$ = limit_type_component.output$
    .publishReplay(1).refCount()
    
  const input_props$ = O.merge(
    shared$,
    limit_type$.skip(1).map(toProps)
  )
 
  const input_component$ = input_props$.map((props: any) => {
    switch (props.type) {
      case opts.LIMIT:
        return LimitComponent(sources, O.of(props.data), in_app_enabled$, 'Performer limit')
      case opts.LIMIT_BY_SIGN_UP_TYPE:
        return LimitByTypeComponent(sources, O.of(props.data), in_app_enabled$, 'Performer limit')
      default:
        return BlankStructuredUndefined()
    }
  }).publishReplay(1).refCount()

  const input_component = {
    DOM: input_component$.switchMap(x => x.DOM),
    output$: input_component$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
    limit_type: limit_type_component.DOM,
    input: input_component.DOM
  }).debounceTime(0).map((components: any) => {
    return div('.column', [
      div('.sub-heading.section-heading', ['Performer limit']),
      components.limit_type,
      components.input ? span(`.small-margin-top`, [components.input]) : null
    ])
  })

  const output$ = combineObj({
    limit_type$,
    input: input_component.output$
  }).debounceTime(0).map((info: any) => {
    const {limit_type, input} = info
    return {
      ...input,
      data: {
        type: limit_type,
        data: input.data
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}



  // const out = EnableWaitlistComponent(sources, O.of(true))

  // return {
  //   ...out,
  //   output$: out.output$
  //     .map(x => ({data: x, errors: [], valid: true}))

  // return type_component 

  // //return type_componen 