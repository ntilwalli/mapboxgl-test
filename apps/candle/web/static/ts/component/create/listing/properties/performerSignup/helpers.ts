import {Observable as O} from 'rxjs'
import {div, span, select, option} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {default as TextInput, SmartTextInputValidation} from '../../../../../library/smarterTextInput'

import {RelativeTimeOptions as opts} from '../helpers'
export const InPersonEndsOptions = [
  undefined,
  opts.EVENT_START,
  opts.MINUTES_AFTER_EVENT_START,
  opts.MINUTES_BEFORE_EVENT_END,
  opts.EVENT_END
]

function createBlankComponent() {
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

const timeInputProps = O.of({
  placeholder: ``,
  name: `in-person-begins`,
  styleClass: `.time-input`,
  emptyIsError: true
})

function createTimeInputComponent(sources, initialText$, errorMessage) {
  const out = TextInput(sources, {
    validator: createTimeValidator(errorMessage),
    props$: timeInputProps,
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



export function createTimeTypeSelect(options, props$, sources, styleClass?) {
  return props$
    .distinctUntilChanged((x, y) => !!x === !!y)
    .map(props => {
      if (!!props) {
        const click$ = sources.DOM.select('.appTimeTypeSelect').events('change')
          .map(ev => ev.target.value)
        const state$ = O.merge(O.of(props), click$).publishReplay(1).refCount()

        const vtree$ = state$.map(state => {
          return select('.appTimeTypeSelect', options.map(opt => {
            return option({attrs: {value: opt, selected: props === opt}}, [getTimeTypeDisplay(opt)])
          }))
        })

        return {
          DOM: vtree$,
          output$: state$
        }
      } else {
        return createBlankComponent()
      }
    })
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

export function getTimeOptionComponent(component_id, props$, sources) {
  return props$
    .map(toTimeTypeSelector)
    .distinctUntilChanged((x, y) => x[0] === y[0])
    .map(([type, props]) => {
      switch (type) {
        case 'time':
          return createTimeInputComponent(sources, O.of(props.toString()), component_id + ': Invalid number')
        case 'day_time':
          return createDayTimeComponent(sources, O.of(props))
        default:
          return createBlankComponent()
      }
    })
    .publishReplay(1).refCount()

}