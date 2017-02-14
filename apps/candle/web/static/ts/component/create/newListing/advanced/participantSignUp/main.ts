import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input, label, em, strong, i, h4, h5, h6, VNode} from '@cycle/dom'
import {combineObj, createProxy, traceStartStop, mergeSinks, componentify} from '../../../../../utils'
import {
  //DayOfWeekTimeComponent,
  RelativeTimeComponent,
  PreRegistrationInfoComponent, 
  ComboBox, 
  BlankUndefined, 
  BlankStructuredUndefined, 
  NumberInputComponent
} from '../helpers'

import {
  PerformerSignupOptions, 
  RelativeTimeOptions
} from '../../../../../listingTypes'

import clone = require('clone')

const rt_opts = RelativeTimeOptions

interface OutputType {
  data: Object
  errors: string[]
  valid: boolean
}

interface SinksType {
  DOM: O<VNode>
  output$: O<OutputType>
}


function PerformerSignupComboBox(sources, props$) {
  const options = [
    PerformerSignupOptions.IN_PERSON,
    PerformerSignupOptions.PRE_REGISTRATION,
    PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION
  ]

  return isolate(ComboBox)(sources, options, props$)
}

function PreRegistrationRadios(sources, props$) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const click$ = sources.DOM.select('.appPreRegistrationTypeInput').events('click')
     .map(ev => {
       return ev.target.value
     }).publish().refCount()

  click$.subscribe(x => {
    console.log('click$', x)
  })

  const vtree$ = shared$.map(registration_type =>  {

    return div('.row', [
      span('.col-12.d-flex', [
        span('.d-flex.align-items-center.flex-wrap', [
          div('.form-check.form-check-inline.mb-0', [
            label('.form-check-label', [
              input('.appPreRegistrationTypeInput.form-check-input.mr-xs', {attrs: {type: 'radio', name: 'registration-type', value: 'app', checked: registration_type === 'app'}}, []),
              'Enable in Stumplog'
            ])
          ]),
          div('.form-check.form-check-inline.mb-0', [
            label('.form-check-label', [
              input('.appPreRegistrationTypeInput.form-check-input.mr-xs', {attrs: {type: 'radio', name: 'registration-type', value: 'email', checked: registration_type === 'email'}}, []),
              'Via e-mail'
            ])
          ]),
          div('.form-check.form-check-inline.mb-0', [
            label('.form-check-label', [
              input('.appPreRegistrationTypeInput.form-check-input.mr-xs', {attrs: {type: 'radio', name: 'registration-type', value: 'website', checked: registration_type === 'website'}}, []),
              'On external website'
            ])
          ])
        ])
      ])
    ])
  })

  const output$ = O.merge(shared$, click$).letBind(traceStartStop('preregistration radio'))

  return {
    DOM: vtree$,
    output$
  }
}

function fromCheckbox(ev) {
  return ev.target.value
}


function InPersonComponent(sources, props$, component_id) {
  const shared$ = props$
  .map(x => {
    return x
  })
  .publishReplay(1).refCount()

  const begins_component = NumberInputComponent(sources, shared$.map(props => {
    return props ? props.begins.data.minutes.toString() : undefined
  }), component_id + ' begins')

  const begins_component_normalized = {
    DOM: begins_component.DOM,
    output$: begins_component.output$.map((x: any) => {
      return {
        ...x,
        data: {
          type: RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
          data: {
            minutes: x.data
          }
        }
      }
    })
  }

  const ends_options = [
    RelativeTimeOptions.EVENT_START,
    RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
    RelativeTimeOptions.MINUTES_AFTER_EVENT_START,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_END,
    RelativeTimeOptions.EVENT_END
  ]
  const ends_component = RelativeTimeComponent(sources, shared$.pluck('ends'), ends_options, component_id + ' ends', 'Ends')

  const vtree$ = combineObj({
    begins: begins_component_normalized.DOM,
    ends: ends_component.DOM
  }).map((components: any) => {
    return div('.row', [
      div('.col-12', [
        div('.row.mb-xs', [
          div('.col-12.d-flex.flex-wrap', [
            em('.mr-4 ', ['Begins']),
            div('.d-flex.align-items-center.flex-wrap', [
              span('.d-fx-a-c.mr-xs', [
                components.begins
              ]),
              span('.d-fx-a-c', [
                'minutes before event start'
              ])
            ])
          ])
        ]),
        div([
          components.ends
        ])
      ])
    ])
  })

  const output$ = combineObj({
    begins: begins_component_normalized.output$
      .map(x => {
        return x
      }),
    ends: ends_component.output$      
      .map(x => {
        return x
      })
  }).map((components: any) => {
    const {begins, ends} = components
    const errors = [].concat(ends.errors).concat(begins.errors)
    const valid = !!(ends.valid && begins.valid)
    return {
      data: {
        begins: begins.data,
        ends: ends.data
      },
      valid,
      errors
    }
  })

  return {
    ...ends_component,
    DOM: vtree$,
    output$
  }
}


function PreRegistrationComponent(sources, props$, component_id) {
  const shared$ = props$
  .map(x => {
    return x
  })
  .publishReplay(1).refCount()

  const radios_component = isolate(PreRegistrationRadios)(sources, shared$.pluck('type'))

  const radios_output$ = radios_component.output$.publishReplay(1).refCount()

  const input_props$ = O.merge(
    shared$,
    radios_output$.map(type => ({type, data: undefined}))
  )

  const begins_options = [
    //RelativeTimeOptions.NOT_SPECIFIED,
    RelativeTimeOptions.UPON_POSTING,
    RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_START
  ]

  const begins_component = RelativeTimeComponent(sources, shared$.pluck('begins'), begins_options, component_id + ' begins', 'Begins')

  const ends_options = [
    //RelativeTimeOptions.NOT_SPECIFIED,
    RelativeTimeOptions.EVENT_START,
    RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_END,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_END,
    RelativeTimeOptions.EVENT_END
  ]
  const ends_component = RelativeTimeComponent(sources, shared$.pluck('ends'), ends_options, component_id + ' ends', 'Ends')
  const data_component = PreRegistrationInfoComponent(sources, input_props$, component_id)

  const vtree$ = combineObj({
    type: radios_component.DOM,
    begins: begins_component.DOM,
    ends: ends_component.DOM,
    data: data_component.DOM
  }).map((components: any) => {
    return div('.row', [
      div('.col-12', [
        div('.mb-xs', [components.type]),
        div('.mb-xs', [components.begins]),
        div('.mb-xs', {class: {'mb-xs': !!components.data}}, [components.ends]),
        components.data ? components.data : null
      ])
    ])
  })

  //   return div('.column', [
  //     div('.mb-xs', [components.type]),
  //     div('.mb-xs', [components.begins]),
  //     div('.mb-xs', {class: {'mb-xs': !!components.data}}, [components.ends]),
  //     components.data ? components.data : null
  //   ])
  // })

  const output$ = combineObj({
    type: radios_output$,
    begins: begins_component.output$,
    ends: ends_component.output$,
    data: data_component.output$
  }).map((components: any) => {
    const {type, begins, ends, data} = components
    const errors = [].concat(data.errors).concat(ends.errors).concat(begins.errors)
    const valid = !!(data.valid && ends.valid && begins.valid)
    return {
      data: {
        type,
        data: data.data,
        begins: begins.data,
        ends: ends.data
      },
      valid,
      errors
    }
  })

  const merged = mergeSinks(begins_component, ends_component)

  return {
    ...merged,
    DOM: vtree$,
    output$
  }
}

function getInPersonDataDefault() {
  return {
    begins: {
      type: RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
      data: {
        minutes: 15
      }
    },
    ends: {
      type: RelativeTimeOptions.EVENT_START,
      data: undefined
    }
  }
}

function getPreRegistrationDataDefault() {
  return {
    type: 'app',
    data: undefined,
    begins: {
      type: RelativeTimeOptions.UPON_POSTING,
      data: undefined
    },
    ends: {
      type: RelativeTimeOptions.EVENT_START,
      data: undefined
    }
  }
}


function getInPersonDefault() {
  return {
    in_person: getInPersonDataDefault(),
    pre_registration: undefined
  }
}

function getPreRegistrationDefault() {
  return {
    in_person: undefined,
    pre_registration: getPreRegistrationDataDefault()
  }
}

function getInPersonAndPreRegistrationDefault() {
  return {
    in_person: getInPersonDataDefault(),
    pre_registration: getPreRegistrationDataDefault()
  }
}

export function getDefault() {
  return {
    type: PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION,
    data: getInPersonAndPreRegistrationDefault()
  }
}

export default function main(sources, inputs): SinksType {
  const shared$ = inputs.props$.take(1)
    .map(props => {
      return props || getDefault()
    })
    .publishReplay(1).refCount()


  const signup_type_component = PerformerSignupComboBox(sources, shared$.pluck('type'))
  const signup_type$ = signup_type_component.output$
    //.do(x => console.log('sign_up output$ 1', x))
    .publishReplay(1).refCount()

  const input_props$ = O.merge(
    shared$,
    signup_type$.skip(1).map((type) => {
      if (type === PerformerSignupOptions.IN_PERSON) {
        return {
          type,
          data: getInPersonDefault()
        }
      } else if (type === PerformerSignupOptions.PRE_REGISTRATION) {
        return {
          type,
          data: getPreRegistrationDefault()
        } 
      } else if (type === PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION) {
        return {
          type,
          data: getInPersonAndPreRegistrationDefault()
        }
      } 
    })
  )

 
  const in_person_component$ = input_props$.map((props: any) => {
    switch (props.type) {
      case PerformerSignupOptions.IN_PERSON:
      case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
        return InPersonComponent(sources, O.of(props.data.in_person), 'In-person signup')
      default:
        return BlankStructuredUndefined()
    }
  }).publishReplay(1).refCount()

  const in_person_component = componentify(in_person_component$)

  // const in_person_component = {
  //   DOM: in_person_component$.switchMap(x => x.DOM),
  //   output$: in_person_component$.switchMap(x => x.output$)  //.do(x => console.log('sign_up output$ 2', x))
  // }

  const pre_registration_component$ = input_props$.map((props: any) => {
    switch (props.type) {
      case PerformerSignupOptions.PRE_REGISTRATION:
      case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
        return PreRegistrationComponent(sources, O.of(props.data.pre_registration), 'Pre-registration signup')
      default:
        return BlankStructuredUndefined()
    }
  }).publishReplay(1).refCount()

  const pre_registration_component = componentify(pre_registration_component$)

  // const pre_registration_component = {
  //   DOM: pre_registration_component$.switchMap(x => x.DOM),
  //   output$: pre_registration_component$.switchMap(x => x.output$)  //.do(x => console.log('sign_up output$ 3', x))
  // }

  const vtree$ = combineObj({
    signup_type: signup_type_component.DOM,
    in_person: in_person_component.DOM,
    pre_registration: pre_registration_component.DOM
  }).debounceTime(0).map((components: any) => {
    const {signup_type, in_person, pre_registration} = components
    const both = in_person && pre_registration
    //return div('.card.card-block', [
    //  h6('.card-title', ['Performer sign-up']),
    return div([
      div('.mb-xs', [
        signup_type
      ]),
      in_person ? div('.row', {class: {'mb-xs': both}}, [
        div('.col-12', [
          both ? div('.row', [
            div('.col-12', [label('.fw-lighter', [em(['In-person'])])])
          ]) : null,
          both ? div('.row', [
            div('.col-12.pl-indent', [in_person])
          ]) : in_person
        ]) 
      ]) : null,
      pre_registration ? div('.row', [
        div('.col-12', [
          both ? div('.row', [
            div('.col-12', [label('.fw-lighter', [em(['Pre-registration'])])])
          ]) : null,
          both ? div('.row', [
            div('.col-12.pl-indent', [pre_registration])
          ]) : pre_registration,
        ])
      ]) : null
    ])
  })

  // const output$ = combineObj({
  //   type$: signup_type$,
  //   in_person$: in_person_component.output$,
  //   pre_registration$: pre_registration_component.output$
  // })

  const output$ = combineObj({
    in_person: in_person_component$.switchMap(x => x.output$),
    pre_registration: pre_registration_component$.switchMap(x => x.output$),
    type: signup_type$
  })
  .debounceTime(5).map((info: any) => {
    const {type, in_person, pre_registration} = info
    const errors = in_person.errors.concat(pre_registration.errors)
    const valid = in_person.valid && pre_registration.valid
    return {
      errors,
      valid,
      data: {
        type: type,
        data: {
          in_person: in_person.data,
          pre_registration: pre_registration.data
        }
      }
    }
  })
  .publishReplay(1).refCount()

  const merged = mergeSinks(in_person_component, pre_registration_component)
  const component = {
    ...merged,
    DOM: vtree$,
    output$
  }

  return component

}