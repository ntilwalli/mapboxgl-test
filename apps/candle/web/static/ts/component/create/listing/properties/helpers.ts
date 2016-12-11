import {Observable as O} from 'rxjs'
import {div, span, select, option, textarea} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {default as TextInput, SmartTextInputValidation} from '../../../../library/standardTextInput'
import validator = require('validator')
import validUrl = require('valid-url')
import clone = require('clone')
import {
  PerformerSignupOptions,
  PerformerLimitOptions, 
  StageTimeOptions,
  MinutesTypeOptions,
  RelativeTimeOptions, 
  CostOptions,
  PurchaseTypeOptions
} from '../helpers'

import {to12HourTime, toMilitaryTime} from '../../../../helpers/time'
import {combineObj} from '../../../../utils'

import WeekdayRadio from '../../../../library/weekdayRadio'
import TimeInput from '../../../../library/timeInput/main'

const {isEmail} = validator


const rt_opts = RelativeTimeOptions


export function NotesInput(sources, {props$}, styleClass?) {
  const shared$ = props$
    .map(x => {
      return x || ''
    })
    .publishReplay(1).refCount()
  const text$ = sources.DOM.select(`.appTextareaInput`).events('input')
    .map(ev => {
      return ev.target.value
    })
  const state$ = O.merge(shared$, text$).publishReplay(1).refCount()
  const vtree$ = shared$.map(state => {
    return div('.column', [
      div('.row', [
        div('.sub-heading.section-heading', ['Notes'])
      ]),
      div('.column', [
        textarea(`.appTextareaInput.notes-input`, [state])
      ])
    ])
  })

  return {
    DOM: vtree$,
    output$: state$.map(x => ({
      data: x,
      valid: true, 
      errors: []
    }))
  }
} 

function getTextFromOption(opt) {
  switch (opt) {
    case PerformerSignupOptions.IN_PERSON:
      return 'In-person only'
    case PerformerSignupOptions.PRE_REGISTRATION:
      return 'Pre-registration only'
    case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
      return 'In-person + pre-registration'
    default:
      return (opt.substring(0, 1).toUpperCase() + opt.substring(1)).replace(/-/g, ' ').replace(/and/g, '+')
  }

}

export function ComboBox(sources, options, props$, styleClass?) {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const click$ = sources.DOM.select(`.appComboBoxSelect`).events('change')
    .map(ev => {
      return ev.target.value
    })
  const state$ = O.merge(shared$, click$).publishReplay(1).refCount()
  const vtree$ = shared$.map(state => {
    return div(`.select-container`, [
      select(`.appComboBoxSelect`, options.map(opt => {
        return option({attrs: {value: opt, selected: state === opt}}, [
          getTextFromOption(opt)
        ])
      }))
    ])
  })

  return {
    DOM: vtree$,
    output$: state$
  }
} 


export function CostTypeComboBox(sources, options, props$, styleClass?) {
  const shared$ = props$.publishReplay(1).refCount()
  const click$ = sources.DOM.select(`.appCostTypeSelect`).events('change')
    .map(ev => {
      return ev.target.value
    })
  const state$ = O.merge(shared$, click$).publishReplay(1).refCount()


  const vtree$ = shared$.map(state => {
    return div(`.select-container`, [
      select(`.appCostTypeSelect`, options.map(opt => {
        return option({attrs: {value: opt, selected: state === opt}}, [
          (opt.substring(0, 1).toUpperCase() + opt.substring(1)).replace(/-/g, ' ').replace(/and/g, '+')
        ])
      }))
    ])
  })

  return {
    DOM: vtree$,
    output$: state$
  }
} 


export function PurchaseTypeComboBox(sources, options, props$, styleClass?) {
  const shared$ = props$.publishReplay(1).refCount()
  const click$ = sources.DOM.select(`.appPurchaseTypeSelect`).events('change')
    .map(ev => {
      return ev.target.value
    })
  const state$ = O.merge(shared$, click$).publishReplay(1).refCount()


  const vtree$ = shared$.map(state => {
    return div(`.select-container`, [
      select(`.appPurchaseTypeSelect`, options.map(opt => {
        return option({attrs: {value: opt, selected: state === opt}}, [opt.substring(0,1).toUpperCase() + opt.substring(1)])
      }))
    ])
  })

  return {
    DOM: vtree$,
    output$: state$
  }
} 


export function BlankComponent() {
  return {
    DOM: O.of(undefined),
    output$: O.never()
  }
}

export function BlankUndefined() {
  return {
    DOM: O.of(null),
    output$: O.of(undefined)
  }
}

export function BlankStructuredUndefined() {
  return {
    DOM: O.of(null),
    output$: O.of({
      data: undefined,
      valid: true, 
      errors: []
    })
  }
}
          

function createTimeValidator(message): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    if (input && input.match(/^\d+$/)) {
      return {
        value: parseInt(input),
        errors: []
      }
    } else {
      return {
        value: input,
        errors: [message]
      }
    }
  }
}

const numberInputProps = O.of({
  placeholder: ``,
  name: `number-input`,
  styleClass: `.number-input.float-input`,
  emptyIsError: true
})

export function NumberInputComponent(sources, initialText$, errorMessage) {
  const out = TextInput(sources, {
    validator: createTimeValidator(errorMessage),
    props$: numberInputProps,
    initialText$
  })

  return out
}

function createFloatValidator(message): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    if (input && input.match(/^\d+.?\d*$/)) {
      return {
        value: parseFloat(input),
        errors: []
      }
    } else {
      return {
        value: input,
        errors: [message]
      }
    }
  }
}

const floatInputProps = O.of({
  placeholder: ``,
  name: `float-input`,
  styleClass: `.number-input`,
  emptyIsError: true
})

export function FloatInputComponent(sources, initialText$, errorMessage) {
  const out = TextInput(sources, {
    validator: createFloatValidator(errorMessage),
    props$: numberInputProps,
    initialText$
  })

  return out
}


function createTextValidator(message, empty_is_error = true): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    //if (input && input.match(/^[a-zA-Z .]+$/)) {
    if (!empty_is_error || (input && input.length)) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: [message]
      }
    }
  }
}

const nameInputProps = O.of({
  placeholder: `Type name`,
  name: `name-input`,
  styleClass: `.name-input`,
  emptyIsError: false
})

export function NameInputComponent(sources, initialText$, errorMessage) {
  const out = TextInput(sources, {
    validator: createTextValidator(errorMessage),
    props$: nameInputProps,
    initialText$
  })

  return out

}

export function TextInputComponent(sources, initialText$, errorMessage, props) {
  const out = TextInput(sources, {
    validator: createTextValidator(errorMessage, props.emptyIsError),
    props$: O.of(props),
    initialText$
  })

  return out
}

export function DayOfWeekTimeComponent(sources, props$, message) {
  const shared$ = props$.publishReplay(1).refCount()
  const weekday_radio = WeekdayRadio(sources, {
    props$: shared$.map(x => x.day)
  })
  const time_selector = TimeInput(sources, {
    props$: shared$
      .map(x => to12HourTime(x.time))
  })

  const state$ = combineObj({
    day: weekday_radio.output$,
    time: time_selector.output$.map(toMilitaryTime)
  })

  const vtree$ = combineObj({
    day: weekday_radio.DOM,
    time: time_selector.DOM
  }).map((components: any) => {
    return div([
        div(`.item.flex.justify-center.margin-bottom`, [components.day]),
        div(`.item.flex.justify-center.bold`, ['@']),
        div(`.item`, [components.time])
    ])
  })
  
  return {
    DOM: vtree$,
    output$: state$.map((state: any) => {
      let errors = [message] 
      let valid = false
      if (state.day && state.time) {
        valid = true
        errors = []
      }
      return {
        errors,
        valid,
        value: state
      }
    })
  }
}

export function RelativeTimeDataComponent(sources, props$, component_id) {
  const out$ = props$
    .map(toRelativeTimeTypeSelector)
    .distinctUntilChanged((x, y) => x[0] === y[0])
    .map(([type, props]) => {
      switch (type) {
        case 'time':
          const out = NumberInputComponent(sources, O.of(props.minutes.toString()), component_id + ': Invalid number')
          return {
            ...out,
            output$: out.output$.map(x => {
              return {
                ...x,
                data: {
                  minutes: x.data
                }
              }
            })
          }
        case 'day_time':
          return isolate(DayOfWeekTimeComponent)(sources, O.of(props), component_id + ': Date and time must be set')
        default:
          return BlankStructuredUndefined()
      }
    })
    .publishReplay(1).refCount()

  return {
    DOM: out$.switchMap(x => x.DOM),
    output$: out$.switchMap(x => x.output$)
  }
}


export function getRelativeTimeDefault(type) {
  switch (type) {
    // case rt_opts.DAYS_BEFORE_EVENT_START:
    //   return {days: 1}
    case rt_opts.MINUTES_BEFORE_EVENT_START:
    case rt_opts.MINUTES_AFTER_EVENT_START:
    case rt_opts.MINUTES_BEFORE_EVENT_END:
      return {minutes: 15}
    case rt_opts.EVENT_START:
    case rt_opts.EVENT_END:
    case rt_opts.UPON_POSTING:
    //case rt_opts.BLANK:
      return undefined
    case rt_opts.PREVIOUS_WEEKDAY_AT_TIME:
      return {
        day: undefined,
        time: undefined
      }
    default:
      throw new Error('Invalid time option type: ' + type)
  }
}

function toRelativeTimeTypeSelector(props) {
  if (props) {
    const {type, data} = props
    switch (type) {
      //case rt_opts.DAYS_BEFORE_EVENT_START:
      case rt_opts.MINUTES_BEFORE_EVENT_START:
      case rt_opts.MINUTES_AFTER_EVENT_START:
      case rt_opts.MINUTES_BEFORE_EVENT_END:
        return ['time', props.data]
      case rt_opts.EVENT_START:
      case rt_opts.EVENT_END:
      case rt_opts.UPON_POSTING:
      //case rt_opts.BLANK:
        return ['blank', undefined]
      case rt_opts.PREVIOUS_WEEKDAY_AT_TIME:
        return ['day_time', props.data]
      default:
        throw new Error('Invalid time option type: ' + type)
    }
  } else {
    return ['blank', undefined]
  }
}

export function RelativeTimeComponent(sources, props$, options, component_id, heading_title, style_class = '.sub-heading') {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const relative_type_component = isolate(ComboBox)(sources, options, shared$.pluck('type'))
  const relative_type$ = relative_type_component.output$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const input_props$ = relative_type$.map(type => {
      return {type, data: getRelativeTimeDefault(type)}
    })
  const data_component = RelativeTimeDataComponent(sources, input_props$, component_id)

   const vtree$ = combineObj({
    relative_type: relative_type$,
    type: relative_type_component.DOM,
    data: data_component.DOM
  }).debounceTime(0).map((components: any) => {
    const {relative_type, type, data} = components
    const same_line = relative_type !== RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME 
    return div('.column', [
      span('.row', [
        div(`${style_class}.item.flex.align-center`, [heading_title]), 
        span({class: {item: same_line}}, [type]),
        same_line ? data : null
      ]),
      !same_line? span('.column', {style: {width: "20rem"}}, [data]) : null
    ])
  })

  const output$ = combineObj({
    type: relative_type$,
    data: data_component.output$
  }).debounceTime(0).map((components: any) => {
    const {type, data} = components
    const errors = [].concat(data.errors)
    const valid = !!(data.valid)
    return {
      data: {
        type,
        data: data.data
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

const emailInputProps = O.of({
  placeholder: `E-mail address`,
  name: `registration-email`,
  styleClass: `.email-input`,
  emptyIsError: true
})

function makeEmailValidator(message): (string) => SmartTextInputValidation {
  return function (input) {
    if (input && input.length && isEmail(input)) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: [message]
      }
    }
  }
}

const urlInputProps = O.of({
  placeholder: `URL`,
  name: `registration-website`,
  styleClass: `.website-input`,
  emptyIsError: true
})

function makeUrlValidator(message): (string) => SmartTextInputValidation {
    return function(input) {
      if (input && input.length && validUrl.isWebUri(input)) {
        return {
          value: input,
          errors: []
        }
      } else {
        return {
          value: input,
          errors: [message]
        }
      }
    }
}

// export function RegistrationInfoComponent(sources, component_id, props$) {
//   const out$ = props$
//     .map(props => {
//       return !props ? {type: 'blank'} : clone(props)
//     })
//     .distinctUntilChanged((x, y) => {
//       return x.type === y.type
//     })
//     .map(({type, data}) => {
//       switch (type) {
//         case 'email':
//           return TextInput(sources, {
//             validator: makeEmailValidator(component_id + ': Invalid e-mail'),
//             props$: emailInputProps,
//             initialText$: O.of(data)
//           })
//         case 'website':
//           return TextInput(sources, {
//             validator: makeUrlValidator(component_id + ": Invalid url"),
//             props$: urlInputProps,
//             initialText$: O.of(data)
//           })
//         default:
//           return BlankUndefined()
//       }
//     })
//     .publishReplay(1).refCount()

//   return {
//     DOM: out$.switchMap(x => x.DOM),
//     output$: out$.switchMap(x => x.output$)
//   }

// }

export function PreRegistrationInfoComponent(sources, props$, component_id) {
  const out$ = props$
    .distinctUntilChanged((x, y) => {
      return x.type === y.type
    })
    .map(({type, data}) => {
      switch (type) {
        case 'email':
          return TextInput(sources, {
            validator: makeEmailValidator(component_id + ': Invalid e-mail'),
            props$: emailInputProps,
            initialText$: O.of(data)
          })
        case 'website':
          return TextInput(sources, {
            validator: makeUrlValidator(component_id + ": Invalid url"),
            props$: urlInputProps,
            initialText$: O.of(data)
          })
        default:
          return BlankStructuredUndefined()
      }
    })
    .publishReplay(1).refCount()

  return {
    DOM: out$.switchMap(x => x.DOM),
    output$: out$.switchMap(x => x.output$)
  }

}


export {
  PerformerSignupOptions,
  PerformerLimitOptions, 
  StageTimeOptions,
  MinutesTypeOptions,
  RelativeTimeOptions, 
  CostOptions,
  PurchaseTypeOptions
} from '../helpers'
