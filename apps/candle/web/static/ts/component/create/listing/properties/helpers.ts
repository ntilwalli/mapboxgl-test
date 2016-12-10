import {Observable as O} from 'rxjs'
import {div, span, select, option, textarea} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {default as TextInput, SmartTextInputValidation} from '../../../../library/smarterTextInput'
import validator = require('validator')
import validUrl = require('valid-url')
import clone = require('clone')
import {
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

//{style: {position: "relative", top: "-1rem"}},

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
  name: `in-person-begins`,
  styleClass: `.number-input`,
  emptyIsError: true
})

export function NumberInputComponent(sources, initialText$, errorMessage) {
  const out = TextInput(sources, {
    validator: createTimeValidator(errorMessage),
    props$: numberInputProps,
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(x => ({
      data: x.value,
      errors: x.errors,
      valid: x.valid
    }))
  }
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

  return {
    ...out,
    output$: out.output$.map(x => ({
      data: x.value,
      errors: x.errors,
      valid: x.valid
    }))
  }
}

export function TextInputComponent(sources, initialText$, errorMessage, props) {
  const out = TextInput(sources, {
    validator: createTextValidator(errorMessage, props.emptyIsError),
    props$: O.of(props),
    initialText$
  })

  return {
    ...out,
    output$: out.output$.map(x => {
      return {
        data: x.value,
        errors: x.errors,
        valid: x.valid
      }
    })
  }
}



function getTimeTypeDisplay(type) {
  switch (type) {
    case rt_opts.UPON_POSTING:
      return "Upon posting"
    case rt_opts.DAYS_BEFORE_EVENT_START:
      return "Days before event start"
    case rt_opts.MINUTES_BEFORE_EVENT_START:
      return "Minutes before event start"
    case rt_opts.EVENT_START:
      return "Event start"
    case rt_opts.MINUTES_AFTER_EVENT_START:
      return "Minutes after event start"
    case rt_opts.MINUTES_BEFORE_EVENT_END:
      return "Minutes before event end"
    case rt_opts.EVENT_END:
      return "Event end"
    case rt_opts.PREVIOUS_WEEKDAY_AT_TIME:
      return "Previous weekday at time"
    // case rt_opts.BLANK:
    //   return ""
    default:
      throw new Error('Invalid time option type: ' + type)
  }
}



export function TimeTypeComboBox(sources, options, props$, styleClass?) {
  const out$ = props$
    .distinctUntilChanged((x, y) => !!x === !!y)
    .map(props => {
      if (!!props) {

        const out = (sources) => {
          const click$ = sources.DOM.select(`.appTimeTypeSelect`).events('change')
            .map(ev => {
              return ev.target.value
            })
          const state$ = O.merge(O.of(props), click$).publishReplay(1).refCount()


          const vtree$ = state$.map(state => {
            return div(`.select-container`, [
              select(`.appTimeTypeSelect`, options.map(opt => {
                return option({attrs: {value: opt, selected: state === opt}}, [getTimeTypeDisplay(opt)])
              }))
            ])
          })

          return {
            DOM: vtree$,
            output$: state$
          }
        }

        return isolate(out)(sources)
      } else {
        return BlankComponent()
      }
    }).publishReplay(1).refCount()

  return {
    DOM: out$.switchMap(x => x.DOM),
    output$: out$.switchMap(x => x.output$)
  }
} 

function createDayTimeComponent(sources, initialValue$) {
  // const out = TextInput(sources, {
  //   validator: createTimeValidator(errorMessage),
  //   props$: timeInputProps,
  //   initialText$
  // })

  // const sharedInitialValue$

  // const initialDay$

  return {
    // DOM: out.DOM.map(x => {
    //   return div(`.row`, [
    //     span(`.item`, [x]),
    //     span(`.item.flex.align-center`, [text])
    //   ])
    // }),
    // output$: out.output$
  }
}

export function getTimeOptionDefault(type) {
  switch (type) {
    case rt_opts.DAYS_BEFORE_EVENT_START:
      return 1
    case rt_opts.MINUTES_BEFORE_EVENT_START:
    case rt_opts.MINUTES_AFTER_EVENT_START:
    case rt_opts.MINUTES_BEFORE_EVENT_END:
      return 15
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

function toTimeTypeSelector(props) {
  if (props) {
    const {type, data} = props
    switch (type) {
      case rt_opts.DAYS_BEFORE_EVENT_START:
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

export function TimeOptionComponent(sources, component_id, props$) {
  const out$ = props$
    .map(toTimeTypeSelector)
    .distinctUntilChanged((x, y) => x[0] === y[0])
    .map(([type, props]) => {
      switch (type) {
        case 'time':
          return NumberInputComponent(sources, O.of(props.toString()), component_id + ': Invalid number')
        case 'day_time':
          return isolate(DayOfWeekTimeComponent)(sources, O.of(props), component_id + ': Date and time must be set')
        default:
          return BlankComponent()
      }
    })
    .publishReplay(1).refCount()

  return {
    DOM: out$.switchMap(x => x.DOM),
    output$: out$.switchMap(x => x.output$)
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

export function RegistrationInfoComponent(sources, component_id, props$) {
  const out$ = props$
    .map(props => {
      return !props ? {type: 'blank'} : clone(props)
    })
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
          return BlankComponent()
      }
    })
    .publishReplay(1).refCount()

  return {
    DOM: out$.switchMap(x => x.DOM),
    output$: out$.switchMap(x => x.output$)
  }

}

export {
  PerformerLimitOptions, 
  StageTimeOptions,
  MinutesTypeOptions,
  RelativeTimeOptions, 
  CostOptions,
  PurchaseTypeOptions
} from '../helpers'
