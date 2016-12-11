import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input, VNode} from '@cycle/dom'
import {combineObj, createProxy, traceStartStop} from '../../../../../utils'
import {
  PerformerSignupOptions, 
  RelativeTimeOptions, 
  DayOfWeekTimeComponent,
  PreRegistrationInfoComponent, 
  ComboBox, 
  RelativeTimeComponent,
  // TimeOptionComponent, 
  // TimeTypeComboBox, 
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

function getDefault() {
  return {
    radius: 50,
    begins: {
      type: RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
      data: {
        minutes: 15
      }
    },
    ends: {
      type: RelativeTimeOptions.MINUTES_AFTER_EVENT_START,
      data: {
        minutes: 15
      }
    }
  }
}


export default function main(sources, inputs) {
  const component_id = 'Check-in'

  const shared$ = inputs.props$
  .map(x => {
    return x || getDefault()
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
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
    RelativeTimeOptions.EVENT_START,
    RelativeTimeOptions.MINUTES_AFTER_EVENT_START,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_END,
    RelativeTimeOptions.EVENT_END
  ]

  const ends_component = RelativeTimeComponent(sources, shared$.pluck('ends'), ends_options, component_id + ' ends', 'Ends', '.sub-sub-heading')

  const radius_component = NumberInputComponent(
    sources, 
    shared$.pluck('radius').map(radius => {
      return radius ? radius.toString() : undefined
    }), component_id + ' radius: Invalid number'
  )

  const vtree$ = combineObj({
    begins: begins_component_normalized.DOM,
    ends: ends_component.DOM,
    radius: radius_component.DOM
  }).debounceTime(0).map((components: any) => {
    return div('.column.check-in', [
      div('.sub-heading.section-heading ', ['Check-in']),
      div('.row', [
        span('.sub-sub-heading.item.flex.align-center', ['Begins']),
        span('.item', [components.begins]),
        span('flex.align-center', ['minutes before event start'])
      ]),
      components.ends,
      div('.row.align-center', [
        span('.sub-sub-heading.align-center', ['Radius']),
        span('.item', [components.radius]),
        span('.item', ['meters'])
      ])
    ])
  })

  const output$ = combineObj({
    begins: begins_component_normalized.output$,
    ends: ends_component.output$,
    radius: radius_component.output$
  }).debounceTime(0).map((components: any) => {
    const {begins, ends, radius} = components
    const errors = [].concat(radius.errors).concat(ends.errors).concat(begins.errors)
    const valid = !!(ends.valid && begins.valid && radius.valid)
    return {
      data: {
        radius: radius.data,
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

// export default function main(sources, inputs): SinksType {
//   const shared$ = inputs.props$.take(1)
//     .map(props => {
//       return props || getDefault()
//     })
//     .publishReplay(1).refCount()


//   const signup_type_component = PerformerSignupComboBox(sources, shared$.pluck('type'))
//   const signup_type$ = signup_type_component.output$
//     .publishReplay(1).refCount()

//   const input_props$ = O.merge(
//     shared$,
//     signup_type$.skip(1).map((type) => {
//       if (type === PerformerSignupOptions.IN_PERSON) {
//         return {
//           type,
//           data: getInPersonDefault()
//         }
//       } else if (type === PerformerSignupOptions.PRE_REGISTRATION) {
//         return {
//           type,
//           data: getPreRegistrationDefault()
//         } 
//       } else if (type === PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION) {
//         return {
//           type,
//           data: getInPersonAndPreRegistrationDefault()
//         }
//       } 
//     })
//   )

 
//   const in_person_component$ = input_props$.map((props: any) => {
//     switch (props.type) {
//       case PerformerSignupOptions.IN_PERSON:
//       case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
//         return InPersonComponent(sources, O.of(props.data.in_person), 'In-person signup')
//       default:
//         return BlankStructuredUndefined()
//     }
//   }).publishReplay(1).refCount()

//   const in_person_component = {
//     DOM: in_person_component$.switchMap(x => x.DOM),
//     output$: in_person_component$.switchMap(x => x.output$)
//   }

//   const pre_registration_component$ = input_props$.map((props: any) => {
//     switch (props.type) {
//       case PerformerSignupOptions.PRE_REGISTRATION:
//       case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
//         return PreRegistrationComponent(sources, O.of(props.data.pre_registration), 'Pre-registration signup')
//       default:
//         return BlankStructuredUndefined()
//     }
//   }).publishReplay(1).refCount()

//   const pre_registration_component = {
//     DOM: pre_registration_component$.switchMap(x => x.DOM),
//     output$: pre_registration_component$.switchMap(x => x.output$)
//   }

//   const vtree$ = combineObj({
//     signup_type: signup_type_component.DOM,
//     in_person: in_person_component.DOM,
//     pre_registration: pre_registration_component.DOM
//   }).debounceTime(0).map((components: any) => {
//     const {signup_type, in_person, pre_registration} = components
//     return div('.column', [
//       div('.sub-heading.section-heading', ['Performer signup']),
//       signup_type,
//       in_person ? div('.sub-sub-heading.small-margin-top', ['In-person']) : null,
//       in_person ? div('.indented', [in_person]) : null,
//       pre_registration ? div('.sub-sub-heading.small-margin-top', ['Pre-registration']) : null,
//       pre_registration ? div('.indented', [pre_registration]) : null
//     ])
//   })

//   const output$ = combineObj({
//     type$: signup_type$,
//     in_person$: in_person_component.output$,
//     pre_registration$: pre_registration_component.output$
//   }).debounceTime(0).map((info: any) => {
//     const {type, in_person, pre_registration} = info
//     const errors = in_person.errors.concat(pre_registration.errors)
//     const valid = in_person.valid && pre_registration.valid
//     return {
//       errors,
//       valid,
//       data: {
//         type: type,
//         data: {
//           in_person: in_person.data,
//           pre_registration: pre_registration.data
//         }
//       }
//     }
//   })

//   return {
//     DOM: vtree$,
//     output$
//   }
// }