import {Observable as O} from 'rxjs'
import {div, span, form, button, input, select, option, label, h6} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, traceStartStop} from '../../../../../../../utils'
import {RRule, RRuleSet, rrulestr} from 'rrule'
import moment = require('moment')
import clone = require('clone')

import {
  DayOfWeek
} from '../../../../../../../listingTypes'
import {fromCheckbox} from '../../../../../../helpers/listing/utils'

import WeekdaySelector from '../../../../../../../library/weekdaySelector'
import SetposSelector from '../../../../../../../library/setposSelector'
import TextInput, {SmartTextInputValidation} from '../../../../../../../library/bootstrapTextInput'

import MonthCalendar from '../../../../../../../library/monthCalendar'
import DateInput from '../../../../../../../library/bootstrapDateInput'

function intent(sources) {
  const {DOM, Router} = sources

  return {
    freq$: DOM.select(`.appFrequencyComboBox`).events(`change`).map(ev => ev.target.value),
    change_start_month$: O.merge(
      DOM.select(`.appIncrementStartMonth`).events(`click`).mapTo(1),
      DOM.select(`.appDecrementStartMonth`).events(`click`).mapTo(-1)
    ),
    change_end_month$: O.merge(
      DOM.select(`.appIncrementUntilMonth`).events(`click`).mapTo(1),
      DOM.select(`.appDecrementUntilMonth`).events(`click`).mapTo(-1)
    ), 
    clear_dtstart$: DOM.select(`.appClearDTStart`).events(`click`),
    clear_until$: DOM.select(`.appClearUntil`).events(`click`),
    clear_all$: DOM.select(`.appClearAll`).events(`click`),
    session$: Router.history$.map(x => x.state).publishReplay(1).refCount(),
    byweekday$: DOM.select('.appByWeekdayInput').events('click').map(fromCheckbox)
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

function processCheckboxArray(msg, arr) {
  const {type, data} = msg
  const index = arr.indexOf(msg.value)
  if (index >= 0) {
    arr.splice(index, 1)
  } else {
    arr.push(msg.value)
  }

  return arr
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
      rrule.dtstart = date
      return rrule
    })
  })

  const until_r = inputs.until$.map(date => state => {
    return state.update(`rrule`, rrule => {
      rrule.until = date
      return rrule
    })
  })

  const clear_dtstart_r = actions.clear_dtstart$.map(_ => state => {
    return state.update(`rrule`, rrule => {
      rrule.dtstart = undefined
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
      rrule.interval = val.valid ? val.data : undefined
      return rrule
    })
  })

  const byweekday_r = actions.byweekday$.map(val => state => {
    return state.update(`rrule`, rrule=> {
      rrule.byweekday = processCheckboxArray(val, rrule.byweekday)
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

function getDefault() {
  return {
    dtstart: moment().startOf('day'),
    byweekday: [],
    interval: undefined,
    bysetpos: [],
    until: undefined
  }
}
function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs) 

  return inputs.props$
    .switchMap((rrule: any) => {
    
      const init = {
        rrule
      }

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

  return select(`.appFrequencyComboBox.form-control`, [
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
}

function renderCalendar(year, month, component, type, title, style_class = '') {
  
  const cased_type = `${type.substring(0, 1).toUpperCase() + type.substring(1)}`
  return div(`.${type}-date-section.vertical-section${style_class}`, [
    div(`.heading`, [title]),
    div(`.calendar-controller`, [
      button('.appDecrement' + cased_type + 'Month.text-button.fa.fa-angle-left.fa-1-5x'),
      span(`.flex-center`, [moment([year, month]).format('MMM YYYY')]),
      button('.appIncrement' + cased_type + 'Month.text-button.fa.fa-angle-right.fa-1-5x')
    ]),
    div(`.input`, [
      component
    ]),
    //button(`.appClearDT${cased_type}.text-button.flex-center.small-margin-top`, [`clear`])
  ])
}

function has(arr, type) {
  return arr.some(val => val === type)
}

function view(state$, components) {
  return combineObj({
    state$,
    components: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    //console.log(`state`, state)
    const {rrule, start_year, start_month, end_year, end_month} = state
    const {freq, byweekday, bysetpos} = rrule
    const {interval, start_date, end_date} = components
    return div(`.advanced-rrule`, [
      div(`.form-group.mt-4`, [
        label([
          h6([`Starting`])
        ]),
        start_date
      ]),
      div(`.form-group`, [
        label([
          h6([`Frequency`])
        ]),
        renderFreqType(state)
      ]),
      div(`.form-group`, [
        label([
          h6([`Interval`])
        ]),
        interval
      ]),
      div(`.form-group`, [
        h6('.mb-0', [label({attrs: {for: 'byweekday'}}, ['By day'])]),
        div([
        //div('.form-check', [
          label('.form-check-inline', [
            input(`.appByWeekdayInput.form-check-input`, {attrs: {type: 'checkbox', name: 'byweekday', value: DayOfWeek.SUNDAY, checked: has(byweekday, DayOfWeek.SUNDAY)}}, []),
            span('.ml-xs', ['Su'])
          ]),
        //]),
        //div('.form-check', [
          label('.form-check-inline', [
            input(`.appByWeekdayInput.form-check-input`, {attrs: {type: 'checkbox', name: 'byweekday', value: DayOfWeek.MONDAY, checked: has(byweekday, DayOfWeek.MONDAY)}}, []),
            span('.ml-xs', ['Mo'])
          ]),
        //]),
        //div('.form-check', [
          label('.form-check-inline', [
            input(`.appByWeekdayInput.form-check-input`, {attrs: {type: 'checkbox', name: 'byweekday', value: DayOfWeek.TUESDAY, checked: has(byweekday, DayOfWeek.TUESDAY)}}, []),
            span('.ml-xs', ['Tu'])
          ]),
        //]),
        //div('.form-check', [
          label('.form-check-inline', [
            input(`.appByWeekdayInput.form-check-input`, {attrs: {type: 'checkbox', name: 'byweekday', value: DayOfWeek.WEDNESDAY, checked: has(byweekday, DayOfWeek.WEDNESDAY)}}, []),
            span('.ml-xs', ['We'])
          ]),
          label('.form-check-inline', [
            input(`.appByWeekdayInput.form-check-input`, {attrs: {type: 'checkbox', name: 'byweekday', value: DayOfWeek.THURSDAY, checked: has(byweekday, DayOfWeek.THURSDAY)}}, []),
            span('.ml-xs', ['Th'])
          ]),
        //]),
        //div('.form-check', [
          label('.form-check-inline', [
            input(`.appByWeekdayInput.form-check-input`, {attrs: {type: 'checkbox', name: 'byweekday', value: DayOfWeek.FRIDAY, checked: has(byweekday, DayOfWeek.FRIDAY)}}, []),
            span('.ml-xs', ['Fr'])
          ]),
        //]),
        //div('.form-check', [
          label('.form-check-inline', [
            input(`.appByWeekdayInput.form-check-input`, {attrs: {type: 'checkbox', name: 'byweekday', value: DayOfWeek.SATURDAY, checked: has(byweekday, DayOfWeek.SATURDAY)}}, []),
            span('.ml-xs', ['Sa'])
          ])
        //])
        ])
      ]),
      div(`.form-group`, {style: {display: freq === `monthly` ? 'block' : 'none'}}, [
        label([
          h6([`By position`])
        ]),
        bysetpos
      ]),
      div(`.form-group`, [
        label([
          h6([`Ending`])
        ]),
        end_date
      ]),
      //button(`.appClearAll.text-button.flex-center.small-margin-top`, [`clear`])
    ])
  })
}

function numberValidator(val): SmartTextInputValidation {
  const parsed = parseInt(val)
  if (val && !isNaN(parsed)) {
    return {value: val, errors: []}
  } else {
    return {value: undefined, errors: [`Invalid number`]}
  }
}

const numberInputProps = O.of({
  placeholder: '',
  name: `interval`,
  styleClass: `.small-number-input`,
  emptyIsError: false
})


export default function main(sources, inputs) {
  const actions = intent(sources)
  const props$ = inputs.props$
    .map(rrule => {
      const out = rrule ? {
        ...rrule,
        dtstart: rrule.dtstart ? moment().startOf('day') : rrule.dtstart
      } : getDefault()

      return out
    })
    .publishReplay(1).refCount()

  const interval_input = TextInput(sources, {
    validator: numberValidator,
    validateOnBlur: true,
    props$: numberInputProps, 
    errors$: O.never(),
    initialText$: O.of(undefined)
  })

  
  const setpos_selector = SetposSelector(sources, {
    ...inputs, 
    props$: props$
      //.pluck(`rrule`)
      .pluck(`bysetpos`)
      .distinctUntilChanged((x: any, y: any) => JSON.stringify(x.sort()) === JSON.stringify(y.sort()))
    }) 

  const start_date_calendar = isolate(DateInput)(sources, {
    ...inputs,
    props$: props$
      .map((props: any) => {
        return props.dtstart ? props.dtstart.clone() : undefined
      })
      .distinctUntilChanged((x: any, y: any) => {
        return x && x.isSame(y)
      })
  })


  const end_date_calendar = isolate(DateInput)(sources, {
    ...inputs,
    props$: props$
      .map((props: any) => props.until ? props.until.clone() : undefined)
      .distinctUntilChanged((x: any, y: any) => {
        return x && x.isSame(y)
      })
  })

  const state$ = model(actions, {
    ...inputs, 
    props$, 
    interval$: interval_input.output$,
    bysetpos$: setpos_selector.output$,
    dtstart$: start_date_calendar.output$, 
    until$: end_date_calendar.output$
  })

  const components = {
    interval$:  interval_input.DOM,
    bysetpos$:  setpos_selector.DOM,
    start_date$:  start_date_calendar.DOM,
    end_date$:  end_date_calendar.DOM
  }



  const vtree$ = view(state$, components)
  const merged = mergeSinks(interval_input, setpos_selector, start_date_calendar, end_date_calendar)
  return {
    ...merged,
    DOM: vtree$,
    output$: state$.pluck(`rrule`).map(x => {
      return x
    })
  }
}