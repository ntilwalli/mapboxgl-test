import {Observable as O} from 'rxjs'
import {div, span, form, button, input, select, option} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, traceStartStop} from '../../../../../../../utils'
import {RRule, RRuleSet, rrulestr} from 'rrule'
import moment = require('moment')
import clone = require('clone')

import WeekdaySelector from '../../../../../../../library/weekdaySelector'
import SetposSelector from '../../../../../../../library/setposSelector'
import TextInput from '../../../../../../../library/smartTextInput'

import MonthCalendar from '../../../../../../../library/monthCalendar'

function intent(sources) {
  const {DOM, Router} = sources

  return {
    freq$: DOM.select(`.appFrequencyComboBox`).events(`change`).map(ev => ev.target.value),
    change_start_month$: O.merge(
      DOM.select(`.appIncrementStartMonth`).events(`click`).mapTo(1),
      DOM.select(`.appDecrementStartMonth`).events(`click`).mapTo(-1)
    ),
    change_end_month$: O.merge(
      DOM.select(`.appIncrementEndMonth`).events(`click`).mapTo(1),
      DOM.select(`.appDecrementEndMonth`).events(`click`).mapTo(-1)
    ), 
    clear_dtstart$: DOM.select(`.appClearDTStart`).events(`click`),
    clear_until$: DOM.select(`.appClearUntil`).events(`click`),
    clear_all$: DOM.select(`.appClearAll`).events(`click`),
    session$: Router.history$.map(x => x.state).publishReplay(1).refCount()
  }
}

function getYearMonth(t_year, t_month, inc) {
  let month = t_month
  let year = t_year

  if (inc > 0) {
    month = month + inc
    if (month > 11) {
      month = month % 12
      year++
    }

  } else {
    month = month + inc
    if (month < 0) {
      month = month + 12
      year--
    }
  }

  return [year, month]
}

function reducers(actions, inputs) {

  const change_start_month_r = actions.change_start_month$.map(inc => state => {
    const [year, month] = getYearMonth(state.get(`start_year`), state.get(`start_month`), inc)
    return state.set(`start_month`, month).set(`start_year`, year)
  })

  const change_end_month_r = actions.change_end_month$.map(inc => state => {
    const [year, month] = getYearMonth(state.get(`end_year`), state.get(`end_month`), inc)
    return state.set(`end_month`, month).set(`end_year`, year)
  })

  const dtstart_r = inputs.dtstart$.map(date => state => {
    return state.update(`rrule`, rrule => {
      if (rrule.dtstart) {
        if (rrule.dtstart.isSame(date, 'day')) {
          rrule.dtstart = undefined
        } else {
          rrule.dtstart = date
        }
      } else {
        rrule.dtstart = date
      }

      return rrule
    })
  })

  const until_r = inputs.until$.map(date => state => {
    return state.update(`rrule`, rrule => {
      if (rrule.until) {
        if (rrule.until.isSame(date, 'day')) {
          rrule.until = undefined
        } else {
          rrule.until = date
        }
      } else {
        rrule.until = date
      }

      return rrule
    })
  })

  const clear_dtstart_r = actions.clear_dtstart$.map(_ => state => {
    return state.update(`rrule`, rrule => {
      rrule.dtstart = moment()
      return rrule
    })
  })

  const clear_until_r = actions.clear_until$.map(_ => state => {
    return state.update(`rrule`, rrule => {
      rrule.until = undefined
      return rrule
    })
  })

  const freq_r = actions.freq$.map(freq => state => {
    return state.update(`rrule`, rrule => {
      rrule.freq = freq
      if (freq === 'weekly') {
        rrule.bysetpos = []
      }

      return rrule
    })
  })

  const interval_r = inputs.interval$.skip(1).map(val => state => {
    return state.update(`rrule`, rrule => {
      rrule.interval = val
      return rrule
    })
  })

  const byweekday_r = inputs.byweekday$.skip(1).map(val => state => {
    return state.update(`rrule`, rrule => {
      rrule.byweekday = val
      return rrule
    })
  })

  const bysetpos_r = inputs.bysetpos$.skip(1).map(val => state => {
    return state.update(`rrule`, rrule => {
      rrule.bysetpos = val
      return rrule
    })
  })

  return O.merge(
    change_start_month_r, change_end_month_r,
    dtstart_r, until_r, interval_r,
    clear_dtstart_r, clear_until_r,
    freq_r, byweekday_r, bysetpos_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs) 

  return combineObj({
      rrule$: inputs.props$
    })
    .switchMap((info: any) => {
      
      const {rrule} = info
      const init = {
        rrule,
        start_month: moment().month(),
        start_year: moment().year(),
        end_month: moment().month(),
        end_year: moment().year()
      }

      //console.log(`rrule advanced init`, clone(init))

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`rrule state`, x))
    //.letBind(traceStartStop(`rrule state trace`))
    .publishReplay(1).refCount()
}

function renderFreqType(state) {
  const {rrule} = state
  const {freq} = rrule

  return div(`.input`, [
    select(`.appFrequencyComboBox.frequency-input`, [
      option({
          attrs: {
            value: undefined, 
            selected: !freq
          }
        }, [``]),
      option({
          attrs: {
            value: `weekly`,
            selected: freq === `weekly`
          }
        }, [`Weekly`]),
      option({
          attrs: {
            value: `monthly`, 
            selected: freq === `monthly`
          }
        }, [`Monthly`])
    ])
  ])
}

function renderCalendar(year, month, component, type, title, style_class = '') {
  
  const cased_type = `${type.substring(0, 1).toUpperCase() + type.substring(1)}`
  return div(`.${type}-date-section.vertical-section${style_class}`, [
    div(`.heading`, [title]),
    div(`.controller`, [
      button(`.appDecrement${cased_type}Month.text-button.fa.fa-angle-left.fa-1-5x`),
      span(`.flex-center`, [moment([year, month]).format('MMM YYYY')]),
      button(`.appIncrement${cased_type}Month.text-button.fa.fa-angle-right.fa-1-5x`)
    ]),
    div(`.input`, [
      component
    ]),
    //button(`.appClearDT${cased_type}.text-button.flex-center.small-margin-top`, [`clear`])
  ])
}

function view(state$, components) {
  return combineObj({
    state$,
    components: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    //console.log(`state`, state)
    const {rrule, start_year, start_month, end_year, end_month} = state
    const {freq} = rrule
    const {byweekday, interval, bysetpos, start_date, end_date} = components
    return div(`.advanced-rrule`, [
      div(`.frequency-section.section`, [
        div(`.heading`, [`Frequency`]),
        renderFreqType(state)
      ]),
      div(`.interval-section.section`, [
        div(`.heading`, [`Interval`]),
        div(`.input`, [interval])
      ]),
      div(`.byweekday-section.section`, [
        div(`.heading`, [`By day`]),
        div(`.input`, [byweekday])
      ]),
      freq === `monthly` ? div(`.bysetpos-section.section`, [
        div(`.heading`, [`By position`]),
        div(`.input`, [bysetpos])
      ]) : null,
      div(`.date-section`, [
        renderCalendar(start_year, start_month, start_date, 'start', `Beginning`),
        renderCalendar(end_year, end_month, end_date, 'until', `Until`, `.small-margin-top`)
      ])
      //button(`.appClearAll.text-button.flex-center.small-margin-top`, [`clear`])
    ])
  })
}

const intervalInputProps = O.of({
  placeholder: ``,
  name: `interval`,
  styleClass: `.interval-input`
})

export default function main(sources, inputs) {
  const actions = intent(sources)
  const props$ = inputs.props$.publishReplay(1).refCount()

  const interval_input = TextInput(sources, {
    validator: input => {
      const output = parseInt(input)
      if (isNaN(output)) {
        if (input === undefined) {
          return {
            value: input,
            errors: []
          }
        } else {
          return {
            value: input,
            errors: [`Invalid number`]
          }
        }
      } else {
        if (output > 0) {
          return {
            value: output,
            errors: []
          }
        } else {
          return {
            value: output,
            errors: [`Must be empty or greater than zero`]
          }
        }
      }
    },
    props$: intervalInputProps, 
    initialText$: props$.pluck(`interval`)
  })

  const weekday_selector = WeekdaySelector(sources, {...inputs, props$: props$.pluck(`byweekday`)})
  //const setpos_selector = SetposSelector(sources, {...inputs, props$: props$.pluck(`bysetpos`)}) 
  const bysetpos$ = createProxy()
  const dtstart$ = createProxy()
  const until$ = createProxy()
  const state$ = model(actions, {
    ...inputs, 
    props$, 
    byweekday$: weekday_selector.output$,
      //.letBind(traceStartStop(`byweekday trace`)),
    interval$: interval_input.output$,
    bysetpos$,
    dtstart$, 
    until$
  })
  
  const setpos_selector = SetposSelector(sources, {
    ...inputs, 
    props$: state$
      .pluck(`rrule`)
      .pluck(`bysetpos`)
      .distinctUntilChanged((x: any, y: any) => JSON.stringify(x.sort()) === JSON.stringify(y.sort()))
    }) 

  const start_date_calendar = isolate(MonthCalendar)(sources, {
    ...inputs, 
    props$: state$.map((state: any) => ({
      year: state.start_year, 
      month: state.start_month, 
      selected: state.rrule.dtstart ? [state.rrule.dtstart] : []
    }))
  })

  const end_date_calendar = isolate(MonthCalendar)(sources, {
    ...inputs, 
    props$: state$.map((state: any) => ({
      year: state.end_year, 
      month: state.end_month, 
      selected: state.rrule.until ? [state.rrule.until] : []
    }))
  })

  dtstart$.attach(start_date_calendar.output$)
  until$.attach(end_date_calendar.output$)

  const components = {
    byweekday$: weekday_selector.DOM,
    interval$: interval_input.DOM,
    bysetpos$: setpos_selector.DOM,
    start_date$: start_date_calendar.DOM,
    end_date$: end_date_calendar.DOM
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$.pluck(`rrule`)
  }
}