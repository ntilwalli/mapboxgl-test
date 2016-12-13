import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input, VNode} from '@cycle/dom'
import {combineObj, createProxy, traceStartStop} from '../../../../../utils'
import {
  PerformerSignupOptions, 
  RelativeTimeOptions, 
  DayOfWeekTimeComponent,
  RelativeTimeComponent,
  PreRegistrationInfoComponent, 
  ComboBox, 
  BlankUndefined, 
  BlankStructuredUndefined, 
  NumberInputComponent
} from '../helpers'
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

  const click$ = sources.DOM.select('.appRegistrationTypeInput').events('click')
     .map(ev => {
       return ev.target.value
     })

  const vtree$ = shared$.map(registration_type =>  {
    return div('.row.margin-bottom', [
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
    ])
  })

  const output$ = O.merge(shared$, click$)

  return {
    DOM: vtree$,
    output$
  }
}

function fromCheckbox(ev) {
  return ev.target.value
}

function InPersonStyleComponent(sources, props$) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const vtree$ = shared$.map(styles =>  {
    return div('.row.align-center', [
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
  })

  const click$ = sources.DOM.select('.appInPersonStyleInput').events('click')
     .map(fromCheckbox)

  const state$ = props$.switchMap(props => {
    const init = JSON.parse(JSON.stringify({value: props})).value
    return click$
      .startWith(init)
      .scan((acc, style) => {
        const index = acc.findIndex(x => x === style)
        if (index >= 0) {
          acc.splice(index, 1)
        } else {
          acc.push(style)
        }

        return acc
      })
  })

  return {
    DOM: vtree$,
    output$: state$
  }
}

function InPersonComponent(sources, props$, component_id) {
  const shared$ = props$
  .map(x => {
    return x
  })
  .publishReplay(1).refCount()

  const begins_component = NumberInputComponent(sources, shared$.map(props => {
    return props ? props.begins.data.minutes.toString() : undefined
  }), component_id + ' begins: Invalid number')

  const begins_component_normalized = {
    DOM: begins_component.DOM,
    output$: begins_component.output$.map(x => {
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
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_END,
    RelativeTimeOptions.EVENT_END
  ]
  const ends_component = RelativeTimeComponent(sources, shared$.pluck('ends'), ends_options, component_id + ' ends', 'Ends')
  const styles_component = InPersonStyleComponent(sources, shared$.pluck('styles'))

  const vtree$ = combineObj({
    begins: begins_component_normalized.DOM,
    ends: ends_component.DOM,
    styles: styles_component.DOM
  }).debounceTime(0).map((components: any) => {
    return div('.column', [
      div('.row', [
        span('.sub-heading.item.flex.align-center', ['Begins']),
        span('.item', [components.begins]),
        span('flex.align-center', ['minutes before event start'])
      ]),
      components.ends,
      components.styles
    ])
  })

  const output$ = combineObj({
    begins: begins_component_normalized.output$,
    ends: ends_component.output$,
    styles: styles_component.output$
  }).debounceTime(0).map((components: any) => {
    const {begins, ends, styles} = components
    const errors = [].concat(ends.errors).concat(begins.errors)
    const valid = !!(ends.valid && begins.valid)
    return {
      data: {
        styles,
        begins: begins.data,
        ends: ends.data
      },
      valid,
      errors
    }
  })

  return {
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

  const radios_component = PreRegistrationRadios(sources, shared$.pluck('type'))

  const radios_output$ = radios_component.output$.publishReplay(1).refCount()
  const input_props$ = O.merge(
    shared$,
    radios_output$.map(type => ({type, data: undefined}))
  )

  const begins_options = [
    RelativeTimeOptions.UPON_POSTING,
    RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_START
  ]

  const begins_component = RelativeTimeComponent(sources, shared$.pluck('begins'), begins_options, component_id + ' begins', 'Begins')

  const ends_options = [
    RelativeTimeOptions.EVENT_START,
    RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
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
  }).debounceTime(0).map((components: any) => {
    return div('.column', [
      components.type,
      components.begins,
      components.ends,
      components.data ? components.data : null
    ])
  })

  const output$ = combineObj({
    type: radios_output$,
    begins: begins_component.output$,
    ends: ends_component.output$,
    data: data_component.output$
  }).debounceTime(0).map((components: any) => {
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

  return {
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
    },
    styles: ['bucket']
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

function getDefault() {
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

  const in_person_component = {
    DOM: in_person_component$.switchMap(x => x.DOM),
    output$: in_person_component$.switchMap(x => x.output$)
  }

  const pre_registration_component$ = input_props$.map((props: any) => {
    switch (props.type) {
      case PerformerSignupOptions.PRE_REGISTRATION:
      case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
        return PreRegistrationComponent(sources, O.of(props.data.pre_registration), 'Pre-registration signup')
      default:
        return BlankStructuredUndefined()
    }
  }).publishReplay(1).refCount()

  const pre_registration_component = {
    DOM: pre_registration_component$.switchMap(x => x.DOM),
    output$: pre_registration_component$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
    signup_type: signup_type_component.DOM,
    in_person: in_person_component.DOM,
    pre_registration: pre_registration_component.DOM
  }).debounceTime(0).map((components: any) => {
    const {signup_type, in_person, pre_registration} = components
    const both = in_person && pre_registration
    return div('.column', [
      div('.sub-heading.section-heading', ['Performer signup']),
      signup_type,
      both ? div('.sub-sub-heading.small-margin-top', ['In-person']) : null,
      in_person ? div({class: {indented: both, "small-margin-top": !both}}, [in_person]) : null,
      both ? div('.sub-sub-heading.small-margin-top', ['Pre-registration']) : null,
      pre_registration ? div({class: {indented: both, "small-margin-top": !both}},[pre_registration]) : null
    ])
  })

  const output$ = combineObj({
    type$: signup_type$,
    in_person$: in_person_component.output$,
    pre_registration$: pre_registration_component.output$
  }).debounceTime(0).map((info: any) => {
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

  return {
    DOM: vtree$,
    output$
  }
}