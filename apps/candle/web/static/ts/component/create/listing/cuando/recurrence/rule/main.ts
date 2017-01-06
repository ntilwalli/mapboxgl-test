import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, em, span, input, button, small} from '@cycle/dom'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, isInteger} from '../../../../../../utils'
import {ComboBox, BlankStructuredUndefined, FloatInputComponent, NumberInputComponent} from '../../../properties/helpers'
import WeekdaySelector from '../../../../../../library/bootstrapWeekdaySelect'
import SetPositionSelector from '../../../../../../library/bootstrapSetPositionSelect'

import {
  DayOfWeek,
  RecurrenceFrequency,
  SetPositionTypes
} from '../../../../../../listingTypes'


function getWeeklyDefault() {
  return {
    day: DayOfWeek.SUNDAY,
    interval: 1
  }
}

function getMonthlyDefault() {
  return {
    day: DayOfWeek.SUNDAY,
    interval: 1,
    setpos: SetPositionTypes.FIRST
  }
}

export function getDefault() {
  return {
    type: RecurrenceFrequency.WEEKLY,
    data: getWeeklyDefault()
  }
}

function WeeklyComponent(sources, props$, component_id = '') {
  const shared$ = props$
      .map(x => {
      return x || getWeeklyDefault()
    })
    .publishReplay(1).refCount()


  const weekday_selector = WeekdaySelector(sources, shared$.pluck('day').map(x => {
    return x
  }))
  
  const vtree$ = combineObj({
    weekday: weekday_selector.DOM,
  }).map((components: any) => {
    const {weekday} = components
    return div('.row', [
      div('.col-xs-12', [weekday])
    ])
  })

  const output$ = combineObj({
      weekday: weekday_selector.output$
    })
    .map((info: any) => {
      return {
        errors: [],
        valid: true,
        data: {
          day: info.weekday
        }
      }
    })

  return {
    DOM: vtree$,
    output$
  }
}

function MonthlyComponent(sources, props$, component_id = '') {
  const shared$ = props$
      .map(x => {
      return x || getMonthlyDefault()
    })
    .publishReplay(1).refCount()


  const weekday_selector = WeekdaySelector(sources, shared$.pluck('day').map(x => {
    return x
  }))

  const setpos_type$ = shared$.pluck('setpos').take(1).publishReplay(1).refCount()
  const setpos_component = SetPositionSelector(sources, setpos_type$)

  const vtree$ = combineObj({
      weekday: weekday_selector.DOM
        .map(x => {
          return x
        }),
      setpos: setpos_component.DOM
        .map(x => {
          return x
        })
    }).map((components: any) => {
      const {weekday, setpos} = components
      return div('.row', [
        div('.col-xs-12.d-fx-a-c', [
          span('.mr-xs', [setpos]),
          span([weekday])
        ])
      ])
    })

  const setpos_output$ =  setpos_component.output$.publishReplay(1).refCount()
  // setpos_output$.subscribe(x => {
  //   console.log('blah', x)
  // })

  const output$ = combineObj({
      weekday: weekday_selector.output$,
      setpos: setpos_output$
    }).map((info: any) => {
      return {
        errors: [],
        valid: true,
        data: {
          day: info.weekday,
          setpos: info.setpos
        }
      }
    })

  return {
    DOM: vtree$,
    output$
  }
}

function toDefault(type) {
  switch (type) {
    case RecurrenceFrequency.WEEKLY:
      return {type, data: getWeeklyDefault()}
    case RecurrenceFrequency.MONTHLY:
      return {type, data: getMonthlyDefault()}
    default:
      throw new Error()
  }
}

function addStructure(val) {
  return {
    data: val,
    errors: [],
    valid: true
  }
}

export default function main(sources, inputs) {//props$) {
  const component_id = 'Recurrence rule'
  const shared$ = inputs.props$
    .map(x => {
      return x || getDefault()
    })
    .publishReplay(1).refCount()

  const options = [
    RecurrenceFrequency.WEEKLY,
    RecurrenceFrequency.MONTHLY
  ]

  const type_component = isolate(ComboBox)(sources, options, shared$.pluck('type').take(1))
  const data_component$ = O.merge(
      type_component.output$.skip(1)
        .map(toDefault),
      shared$.take(1)
    )
    .map((props: any) => {
      switch (props.type) {
        case RecurrenceFrequency.WEEKLY:
          return WeeklyComponent(sources, O.of(props.data), component_id)
        case RecurrenceFrequency.MONTHLY: 
          return MonthlyComponent(sources, O.of(props.data), component_id)
        default: 
          throw new Error()
      }
    }).publishReplay(1).refCount()

  const data_component = {
    DOM: data_component$.switchMap(x => x.DOM),
    output$: data_component$.switchMap(x => x.output$)
  }

  const interval_input = NumberInputComponent(
    sources, 
    shared$.pluck('data').pluck('interval').map(x => x ? x.toString() : 1), 
    component_id
  )

  const ii_output$ = interval_input.output$.publishReplay(1).refCount()

  const has_interval$ = sources.DOM.select('.appHasIntervalButton').events('click')
    .mapTo(true)
    .publishReplay(1).refCount()
  const no_interval$ = sources.DOM.select('.appNoIntervalButton').events('click')
    .mapTo(false)
    .publishReplay(1).refCount()
  
  const interval_output$ = O.merge(
    ii_output$.take(1),
    has_interval$.withLatestFrom(ii_output$, (_, out) => out),
    no_interval$.mapTo(addStructure(1))
  )
  
  const display_interval$ = interval_output$
    .take(1)
    .map((x: any) => x.valid ? x.data > 1 ? true : false : false)
    .switchMap(init => {
      return O.merge(has_interval$, no_interval$).startWith(init)
    })

  const vtree$ = combineObj({
    display_interval$,
    type: type_component.DOM
      .map(x => {
        return x 
      }),
    data: data_component.DOM
      .map(x => {
        return x 
      }),
    interval: interval_input.DOM      
      .map(x => {
        return x 
      })
  }).map((components: any) => {
    const {display_interval, type, data, interval} = components
    return div('.row', [
      div('.col-xs-12', [
        div('.row', [
          div('.d-fx-a-c.col-xs-12', [
            div('.d-fx-a-c', [
              div('.mr-xs', [type]), 
              div('.mr-1', [data]), 
              button('.d-fx-a-c.btn.btn-link.mr-2', {
                  class: {
                    appHasIntervalButton: !display_interval,
                    appNoIntervalButton: display_interval
                  }
                }, [
                small([display_interval ? 'No interval' : 'w/ interval'])
              ]),
              button('.appSubtractButton.d-fx-a-c.fa.fa-minus.plus-button.btn.btn-link', [])
            ])
          ])
        ]),
        div('.row', [
          div(
            '.col-xs-12.d-fx-a-c.ml-1',
            {style: {display: display_interval ? 'flex' : 'none'}}, 
            [span('.mr-xs', ['Interval']), interval]
          )
        ])
      ])
    ])
  })

  const output$ = combineObj({
    type: type_component.output$      
      .map(x => {
        return x 
      }),
    data: data_component.output$
      .map(x => {
        return x 
      }),
    interval: interval_output$
      .map(x => {
        return x 
      })
  }).debounceTime(0)
    .map((components: any) => {
    const {type, data, interval} = components
    const errors = data.errors.concat(interval.errors)
    const valid = errors.length === 0
    return {
      errors,
      valid,
      data: {
        type,
        data: {
          ...data.data,
          interval: interval.data
        }
      }
    }
  })

  return {
    DOM: vtree$,
    output$: output$.map(msg => {
      return {
        index: inputs.component_index,
        data: msg
      }
    }),
    remove$: sources.DOM.select('.appSubtractButton').events('click').mapTo(inputs.component_index)
  }
}
 