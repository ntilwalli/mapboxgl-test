import {Observable as O} from 'rxjs'
import {div, span, select, option} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {default as TextInput, SmartTextInputValidation} from '../../../../library/smarterTextInput'
import validator = require('validator')
import validUrl = require('valid-url')
import clone = require('clone')

import {to12HourTime, toMilitaryTime} from '../../../../helpers/time'
import {combineObj} from '../../../../utils'

import WeekdayRadio from '../../../../library/weekdayRadio'
import TimeInput from '../../../../library/timeInput/main'

const {isEmail} = validator

export const RelativeTimeOptions = {
  //BLANK: 'blank',
  UPON_POSTING: 'upon-posting',
  DAYS_BEFORE_EVENT_START: 'days-before-event-start',
  MINUTES_BEFORE_EVENT_START: 'minutes-before-event-start',
  PREVIOUS_WEEKDAY_AT_TIME: 'previous-weekday-at-time',
  EVENT_START: 'event-start',
  MINUTES_AFTER_EVENT_START: 'minutes-after-event-start',
  MINUTES_BEFORE_EVENT_END: 'minutes-before-event-end',
  EVENT_END: 'event-end'
}

const opts = RelativeTimeOptions


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


// export function DayOfWeekComboBox(sources, props$, styleClass?) {

//   const click$ = sources.DOM.select(`.appDayOfWeekSelect${styleClass}`).events('change')
//     .map(ev => {
//       return ev.target.value
//     })
//   const state$ = O.merge(props$, click$).publishReplay(1).refCount()
//   const options = [
//     'sunday',
//     'monday',
//     'tuesday',
//     'wednesday',
//     'thursday',
//     'friday',
//     'saturday'
//   ]
//   const vtree$ = state$.map(state => {
//     return div(`.select-container`, [
//       select(`.appTimeTypeSelect${styleClass}`, options.map(opt => {
//         return option({attrs: {value: opt, selected: state === opt}}, [opt.substring(0, 1).toUpperCase() + opt.substring(1)])
//       }))
//     ])
//   })

//   return {
//     DOM: vtree$,
//     output$: state$.map(value => ({valid: true, value}))
//   }
// } 


function BlankComponent() {
  return {
    DOM: O.of(undefined),
    output$: O.never()
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

  return out
}

function getTimeTypeDisplay(type) {
  switch (type) {
    case opts.UPON_POSTING:
      return "Upon posting"
    case opts.DAYS_BEFORE_EVENT_START:
      return "Days before event start"
    case opts.MINUTES_BEFORE_EVENT_START:
      return "Minutes before event start"
    case opts.EVENT_START:
      return "Event start"
    case opts.MINUTES_AFTER_EVENT_START:
      return "Minutes after event start"
    case opts.MINUTES_BEFORE_EVENT_END:
      return "Minutes before event end"
    case opts.EVENT_END:
      return "Event end"
    case opts.PREVIOUS_WEEKDAY_AT_TIME:
      return "Previous weekday at time"
    // case opts.BLANK:
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
    case opts.DAYS_BEFORE_EVENT_START:
      return 1
    case opts.MINUTES_BEFORE_EVENT_START:
    case opts.MINUTES_AFTER_EVENT_START:
    case opts.MINUTES_BEFORE_EVENT_END:
      return 15
    case opts.EVENT_START:
    case opts.EVENT_END:
    case opts.UPON_POSTING:
    //case opts.BLANK:
      return undefined
    case opts.PREVIOUS_WEEKDAY_AT_TIME:
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
      case opts.DAYS_BEFORE_EVENT_START:
      case opts.MINUTES_BEFORE_EVENT_START:
      case opts.MINUTES_AFTER_EVENT_START:
      case opts.MINUTES_BEFORE_EVENT_END:
        return ['time', props.data]
      case opts.EVENT_START:
      case opts.EVENT_END:
      case opts.UPON_POSTING:
      //case opts.BLANK:
        return ['blank', undefined]
      case opts.PREVIOUS_WEEKDAY_AT_TIME:
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

function emailValidator(input): SmartTextInputValidation {
    if (input && input.length && isEmail(input)) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: ['Invalid email address']
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
            validator: emailValidator,
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
