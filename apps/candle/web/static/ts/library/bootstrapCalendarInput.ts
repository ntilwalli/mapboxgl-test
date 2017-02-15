import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, span, button, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, between, notBetween} from '../utils'
import DateInputMonthCalendar from '../library/dateInputMonthCalendar'
import moment = require('moment')
import clone = require('clone')

function intent(sources) {
  const {DOM} = sources
  const change_month$ = O.merge(
      DOM.select(`.appIncMonth`).events(`click`).mapTo(1),
      DOM.select(`.appDecMonth`).events(`click`).mapTo(-1)
    )

  return {
    change_month$
  }
}


function reducers(actions, inputs) {

  const change_month_r = actions.change_month$.map(inc => state => {
    let month = state.get('calendar_month')
    let year = state.get('calendar_year')

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

    return state.set('calendar_month', month).set('calendar_year', year)
  })

  const calendar_date_r = inputs.calendar_date$.map(val => state => {
    return state
      .set('date', val.date())
      .set('month', val.month())
      .set('year', val.year())
  })

  return O.merge(change_month_r, calendar_date_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(date => {
      //console.log('initializing', date)
      const init = {
        calendar_month: date ? date.month() : moment().month(),
        calendar_year: date ? date.year() : moment().year(),
        month: date ? date.month() : undefined,
        date: date ? date.date() : undefined,
        year: date ? date.year() : undefined
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => clone(x.toJS()))
    //.do(x => console.log('date input', x))
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({state$, components: combineObj(components)})
    .map((info: any) => {
      const {state, components} = info
      const {calendar_year, calendar_month, year, month, date} = state
      const out = (year && month >= 0 && date) ? moment([year, month,date]) : undefined
      const {calendar} = components
      return div('.bootstrap-date-input', [
        div(`.calendar-controller.d-flex.fx-j-sa`, [
          div(`.appDecMonth.btn.btn-link.fa.fa-angle-left.fa-2x`, []),
          div(`.flex-center`, [moment([calendar_year, calendar_month]).format('MMM YYYY')]),
          div(`.appIncMonth.btn.btn-link.fa.fa-angle-right.fa-2x`, []) 
        ]),
        div('.d-flex.justify-content-center', [
          calendar
        ])
      ])
  })

}


export default function  main(sources, inputs) {
  const actions = intent(sources)
  const calendar_date$ = createProxy()
  const state$ = model(actions, {...inputs, calendar_date$})

  const calendar = isolate(DateInputMonthCalendar)(
    sources, {
      ...inputs, 
      props$: state$.map((state: any) => {
        const {calendar_month, calendar_year, year, month, date} = state
        return ({
          year: calendar_year, 
          month: calendar_month, 
          selected: (year && month >= 0 && date) ? [moment([year, month, date])] : []
        })
      })
    })

  calendar_date$.attach(calendar.output$)

  const components = {
    calendar: calendar.DOM
  }

  return {
    DOM: view(state$, components),
    output$: state$
      // .filter(state => {
      //   const {month, date, year} = state
      //   return month >= 0 && date && year
      // })
      .map(state => {
        const {month, date, year} = state
        return month >= 0 && date && year ? moment([year, month, date]) : undefined
      })
      .distinctUntilChanged((x, y) => {
        const out = (x && y && x.isSame(y))
        return out
      })
  }
}
