import {Observable as O} from 'rxjs'
import {div, h6, em, span, select, option, textarea, label} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {default as TextInput, SmartTextInputValidation} from '../../../../library/bootstrapTextInput'
import validator = require('validator')
import validUrl = require('valid-url')
//import {validate as twitterValidate} from 'twitter-validate'  // for some reason module fails to be found on heroku, debug later
import clone = require('clone')
import {
  PerformerSignupOptions,
  PerformerLimitOptions, 
  StageTimeOptions,
  MinutesTypeOptions,
  RelativeTimeOptions, 
  CostOptions,
  PurchaseTypeOptions
} from '../../../../listingTypes'

import {to12HourTime, toMilitaryTime} from '../../../../helpers/time'
import {combineObj, componentify, mergeSinks} from '../../../../utils'

import WeekdayRadio from '../../../../library/weekdayRadio'
import TimeInput from '../../../../library/timeInput/main'
import BootstrapTimeInput from '../../../../library/bootstrapTimeInput'
import BootstrapWeekdaySelect from '../../../../library/bootstrapWeekdaySelect'

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
    // return div('.card.card-block', [
    //   h6('.card-title', ['Note']),
    return div([
      textarea(`.appTextareaInput.form-control`, [state])
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
    case "blank":
      return ''
    case PerformerSignupOptions.IN_PERSON:
      return 'In-person only'
    case PerformerSignupOptions.PRE_REGISTRATION:
      return 'Pre-registration only'
    case PerformerSignupOptions.IN_PERSON_AND_PRE_REGISTRATION:
      return 'In-person + pre-registration'
    default:
      return (opt.substring(0, 1).toUpperCase() + opt.substring(1)).replace(/_/g, ' ').replace(/and/g, '+')
  }
}

export function StyledComboBox(sources, options, props$, style_class = '') {
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
    return select(`.appComboBoxSelect.form-control.form-control` + style_class, options.map(opt => {
        return option({attrs: {value: opt, selected: state === opt}}, [
          getTextFromOption(opt)
        ])
      }))
  })

  return {
    DOM: vtree$,
    output$: state$
  }
} 

export function ComboBox(sources, options, props$, mapper?) {
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
    return select(`.appComboBoxSelect.form-control.form-control`, options.map(opt => {
        return option({attrs: {value: opt, selected: state === opt}}, [
          mapper ? mapper(opt) : getTextFromOption(opt)
        ])
      }))
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
          (opt.substring(0, 1).toUpperCase() + opt.substring(1)).replace(/_/g, ' ').replace(/and/g, '+')
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


function genericValidator(input, f, empty_is_error) {
  if (!input && !empty_is_error) {
    return {
      value: input,
      errors: []
    }
  } else if (input) {
    if (!input.length && !empty_is_error) {
      return {
        value: input,
        errors: []
      }
    } else if (input.length) {
      return f(input)
    } else {
      return  {
        value: input,
        errors: ['Cannot be empty']
      }
    }
  } else {
    return {
      value: input,
      errors: ['Cannot be empty']
    }
  }
}

// function genericValidator(input, f, empty_is_error) {
//   return (!input && !empty_is_error) || (input && ((!input.length && !empty_is_error) || (input.length && f(input))))
// }

const emailTest = isEmail
const urlTest = validUrl.isWebUri
const twitterTest = () => true//twitterValidate 
const naturalNumberTest = input => input.match(/^\d+$/)
const floatTest = input => input.match(/^\d+.?\d*$/)
const passTest = input => true

function makeEmailValidator(message, empty_is_error = true): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    //if (input && input.match(/^[a-zA-Z .]+$/)) {
    if (genericValidator(input, emailTest, empty_is_error)) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: ['Invalid e-mail address']
      }
    }
  }
}

const email_input_props = {
  placeholder: `E-mail address`,
  name: `registration-email`,
  styleClass: `.email-input.form-control`,
  emptyIsError: true
}

export function EmailInputComponent(sources, initialText$, component_id, props = email_input_props) {
  const out = isolate(TextInput)(sources, {
    validator: makeEmailValidator(props.emptyIsError),
    props$: O.of(props),
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        ...val,
        errors: val.errors ? val.errors.map(x => component_id + ': ' + x) : val.errors
      }
    })
  }
}

function makeURLValidator(empty_is_error = true): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    //if (input && input.match(/^[a-zA-Z .]+$/)) {
    if (genericValidator(input, urlTest, empty_is_error)) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: ['Invalid URL']
      }
    }
  }
}

const url_input_props = {
  placeholder: `URL`,
  name: `website-input`,
  styleClass: `.website-input.form-control`,
  emptyIsError: true
}

export function URLInputComponent(sources, initialText$, component_id, props = url_input_props) {
  const out = isolate(TextInput)(sources, {
    validator: makeURLValidator(props.emptyIsError),
    props$: O.of(props),
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        ...val,
        errors: val.errors ? val.errors.map(x => component_id + ': ' + x) : val.errors
      }
    })
  }
}

function makeTwitterValidator(empty_is_error = true): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    //if (input && input.match(/^[a-zA-Z .]+$/)) {
    if (genericValidator(input, twitterTest, empty_is_error)) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: ['Invalid twitter handle']
      }
    }
  }
}

const twitter_input_props = {
  placeholder: `Twitter handle`,
  name: `twitter-input`,
  styleClass: `.twitter-input.form-control`,
  emptyIsError: true
}

export function TwitterInputComponent(sources, initialText$, component_id, props = url_input_props) {
  const out = isolate(TextInput)(sources, {
    validator: makeTwitterValidator(props.emptyIsError),
    props$: O.of(props),
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        ...val,
        errors: val.errors ? val.errors.map(x => component_id + ': ' + x) : val.errors
      }
    })
  }
}
          

function createNaturalNumberValidator(empty_is_error = true): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    if (genericValidator(input, naturalNumberTest, empty_is_error)) {
      return {
        value: parseInt(input),
        errors: []
      }
    } else {
      return {
        value: input,
        errors: ['Invalid number']
      }
    }
  }
}

const numberInputProps = O.of({
  placeholder: ``,
  name: `number-input`,
  styleClass: `.small-number-input.form-control`,
  emptyIsError: true
})

export function NumberInputComponent(sources, initialText$, component_id) {
  const out = isolate(TextInput)(sources, {
    validator: createNaturalNumberValidator(),
    props$: numberInputProps,
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        ...val,
        errors: val.errors ? val.errors.map(x => component_id + ': ' + x) : val.errors
      }
    })
  }
}

function createFloatValidator(empty_is_error = true): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    if (genericValidator(input, floatTest, empty_is_error)) {
      return {
        value: parseFloat(input),
        errors: []
      }
    } else {
      return {
        value: input,
        errors: ['Invalid number']
      }
    }
  }
}

const floatInputProps = O.of({
  placeholder: ``,
  name: `float-input`,
  styleClass: `.number-input.form-control`,
  emptyIsError: true
})

export function FloatInputComponent(sources, initialText$, component_id) {
  const out = isolate(TextInput)(sources, {
    validator: createFloatValidator(),
    props$: numberInputProps,
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        ...val,
        errors: val.errors ? val.errors.map(x => component_id + ': ' + x) : val.errors
      }
    })
  }
}


function createTextValidator(empty_is_error = true): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    //if (input && input.match(/^[a-zA-Z .]+$/)) {
    if (genericValidator(input, passTest, empty_is_error)) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: ['Invalid text']
      }
    }
  }
}

const nameInputProps = O.of({
  placeholder: `Type name`,
  name: `name-input`,
  styleClass: `.name-input.form-control`,
  emptyIsError: false
})

export function NameInputComponent(sources, initialText$, component_id) {
  const out = isolate(TextInput)(sources, {
    validator: createTextValidator(),
    props$: nameInputProps,
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        ...val,
        errors: val.errors ? val.errors.map(x => component_id + ': ' + x) : val.errors
      }
    })
  }

}

export function TextInputComponent(sources, initialText$, component_id, props) {
  const out = isolate(TextInput)(sources, {
    validator: createTextValidator(props.emptyIsError),
    props$: O.of(props),
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        ...val,
        errors: val.errors ? val.errors.map(x => component_id + ': ' + x) : val.errors
      }
    })
  }
}

// export function DayOfWeekTimeComponent(sources, props$, message) {
//   const shared$ = props$.publishReplay(1).refCount()
//   const weekday_radio = WeekdayRadio(sources, {
//     props$: shared$.map(x => x.day)
//   })
//   const time_selector = TimeInput(sources, {
//     props$: shared$
//       .map(x => to12HourTime(x.time))
//   })

//   const state$ = combineObj({
//     day: weekday_radio.output$,
//     time: time_selector.output$.map(toMilitaryTime)
//   })

//   const vtree$ = combineObj({
//     day: weekday_radio.DOM,
//     time: time_selector.DOM
//   }).map((components: any) => {
//     return div([
//         div(`.item.flex.justify-center.margin-bottom`, [components.day]),
//         div(`.item.flex.justify-center.bold`, ['@']),
//         div(`.item`, [components.time])
//     ])
//   })
  
//   return {
//     DOM: vtree$,
//     output$: state$.map((state: any) => {
//       let errors = [message] 
//       let valid = false
//       if (state.day && state.time) {
//         valid = true
//         errors = []
//       }
//       return {
//         errors,
//         valid,
//         value: state
//       }
//     })
//   }
// }

export function BootstrapDayOfWeekTimeComponent(sources, props$, component_id) {
  const shared$ = props$
    .map(x => {
      return x 
    })
    .publishReplay(1).refCount()
  const weekday_select = BootstrapWeekdaySelect(sources, shared$.map(x => x ? x.day : undefined))
  const time_selector = BootstrapTimeInput(sources, shared$.map((x: any) => {
    return x ? x.time : undefined
  }))

  const state$ = combineObj({
    day: weekday_select.output$,
    time: time_selector.output$
  })

  const vtree$ = combineObj({
    day: weekday_select.DOM,
    time: time_selector.DOM
  }).map((components: any) => {
    return div('.d-fx-a-c', [
        // div('.row', [
        //   div('.col-12', [
            span('.mr-4', [components.day]), span('.mr-4', ['@']),
        //   ])
        // ]),
        // div('.row', [
        //   div('.col-12', ['@'])
        // ]),
        // div('.row', [
        //   div('.col-12', [
            components.time
          // ])
        // ])
    ])
  })
  
  const merged = mergeSinks(weekday_select, time_selector)

  return {
    ...merged,
    DOM: vtree$,
    output$: state$.map((state: any) => {
      let errors = [component_id + ': Requires both day and time'] 
      let valid = false
      if (state.day && state.time) {
        valid = true
        errors = []
      }

      return {
        errors,
        valid,
        data: state
      }
    })
  }
}


export function RelativeTimeDataComponent(sources, props$, component_id) {
  const out$ = props$
    .map(x => {
      return toRelativeTimeTypeSelector(x)
    })
    .distinctUntilChanged((x, y) => x[0] === y[0])
    .map(([type, props]) => {
      switch (type) {
        case 'time':
          const out = NumberInputComponent(sources, O.of(props.minutes.toString()), component_id)
          return {
            ...out,
            output$: out.output$.map((x: any) => {
              return {
                ...x,
                data: {
                  minutes: x.data
                }
              }
            })
          }
        case 'day_time':
          return isolate(BootstrapDayOfWeekTimeComponent)(sources, O.of(props), component_id)
        default:
          return BlankStructuredUndefined()
      }
    })
    .publishReplay(1).refCount()

  const out = componentify(out$)

  return {
    ...out,
    DOM: out.DOM,
    output$: out$.switchMap(x => x.output$)
      .map(x => {
        return x
      })
  }
}


export function getRelativeTimeDefault(type) {
  switch (type) {
    case rt_opts.MINUTES_BEFORE_EVENT_START:
    case rt_opts.MINUTES_AFTER_EVENT_START:
    case rt_opts.MINUTES_BEFORE_EVENT_END:
      return {minutes: 15}
    case rt_opts.EVENT_START:
    case rt_opts.EVENT_END:
    case rt_opts.UPON_POSTING:
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
      return x || {
        type: rt_opts.MINUTES_BEFORE_EVENT_START, 
        data: getRelativeTimeDefault(rt_opts.MINUTES_BEFORE_EVENT_START)
      } 
    })
    .publishReplay(1).refCount()

  const relative_type_component = isolate(ComboBox)(sources, options, shared$.pluck('type'))
  const relative_type$ = relative_type_component.output$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const input_props$ = O.merge(
    shared$,
    relative_type$.skip(1).map(type => {
      return {type, data: getRelativeTimeDefault(type)}
    })
  )
  
  const data_component = RelativeTimeDataComponent(sources, input_props$, component_id)

   const vtree$ = combineObj({
    relative_type: relative_type$,
    type: relative_type_component.DOM,
    data: data_component.DOM
  }).debounceTime(0).map((components: any) => {
    const {relative_type, type, data} = components
    const same_line = relative_type !== RelativeTimeOptions.PREVIOUS_WEEKDAY_AT_TIME 
    return div('.row ', [
      div('.col-12', [
        div('.row', [
          div('.col-12.raw-line.fx-wrap', [
            em('.mr-4', [heading_title]),
            div('.content', [
              type,
              data && same_line ? span('.ml-xs', [data]) : null
            ]),
          ]), 
        ]),
        !same_line ? div('.secondary-line.mt-xs', [
          div('.content', [data])
        ]) : null
      ])
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

  const merged = mergeSinks(data_component, relative_type_component)

  return {
    ...merged,
    DOM: vtree$,
    output$
  }
}

export function BootstrapRelativeTimeComponent(sources, props$, options, component_id, heading_title) {
  const shared$ = props$
    .map(x => {
      return x || {
        type: rt_opts.MINUTES_BEFORE_EVENT_START, 
        data: getRelativeTimeDefault(rt_opts.MINUTES_BEFORE_EVENT_START)
      } 
    })
    .publishReplay(1).refCount()

  const relative_type_component = isolate(ComboBox)(sources, options, shared$.pluck('type'))
  const relative_type$ = relative_type_component.output$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const input_props$ = O.merge(
    shared$,
    relative_type$.skip(1).map(type => {
      return {type, data: getRelativeTimeDefault(type)}
    })
  )
  
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
        div(`.item.flex.align-center`, [heading_title]), 
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

  const merged = mergeSinks(data_component, relative_type_component)

  return {
    ...merged,
    DOM: vtree$,
    output$
  }
}



export function PreRegistrationInfoComponent(sources, props$, component_id) {
  const out$ = props$
    .distinctUntilChanged((x, y) => {
      return x.type === y.type
    })
    .map(({type, data}) => {
      switch (type) {
        case 'email':
          return EmailInputComponent(sources, O.of(data), component_id)
        case 'website':
          return URLInputComponent(sources, O.of(data), component_id)
        default:
          return BlankStructuredUndefined()
      }
    })
    .publishReplay(1).refCount()

  const out = componentify(out$)

  return {
    ...out, 
    DOM: out.DOM,
    output$: out$.switchMap(x => x.output$)
  }

}

// export {
//   PerformerSignupOptions,
//   PerformerLimitOptions, 
//   StageTimeOptions,
//   MinutesTypeOptions,
//   RelativeTimeOptions, 
//   CostOptions,
//   PurchaseTypeOptions
// } from '../../../../listingTypes'
