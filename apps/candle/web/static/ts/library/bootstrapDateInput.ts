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
  //const input_focus$ = DOM.select('.appDateInput').events('focus')
  const click$ = DOM.select('.appDateInput').events('click')
    .do(ev => console.log('click$'))
    .map(ev => {
      return ev.target
    })
    .map(el => {
      return el.selectionStart
    })
    .do(x => console.log('selectionStart', x))

  const input_blur$ = DOM.select('.appDateInput').events('blur')
    .do(ev => console.log('blur$'))
    .publish().refCount()
  const dropdown_mousedown$ = DOM.select('.appDateDropdown').events('mousedown')
    .do(x => console.log('mousedown$'))
    .publish().refCount()
  const dropdown_mouseup$ = DOM.select('.appDateDropdown').events('mouseup')
    .do(x => console.log('mouseup$'))
    .publish().refCount()

  const blur_to_dropdown$ = input_blur$
    .do(x => console.log(`blur to dropdown`))
    .let(between(dropdown_mousedown$, dropdown_mouseup$))
  const blur_to_elsewhere$ = input_blur$
    .do(x => console.log(`blur to elsewhere`))
    .let(notBetween(dropdown_mousedown$, dropdown_mouseup$))

  const change_month$ = O.merge(
      DOM.select(`.appIncMonth`).events(`click`).mapTo(1),
      DOM.select(`.appDecMonth`).events(`click`).mapTo(-1)
    )

  return {
    click$,
    blur_to_dropdown$,
    blur_to_elsewhere$,
    change_month$
  }
}

function validateMonth(info) {
  const val = parseInt(info)
  if (val > 0 && val < 13) {
    return val
  } else {
    return null
  }
}

function validateDay(info) {
  const val = parseInt(info)
  if (val > 0 && val < 13) {
    return val
  } else {
    return null
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

  const click_r = actions.click$.map(_ => state => {
    return state.set('active', true)
  })

  const blur_r = actions.blur_to_elsewhere$.map(ev => state => {
    const val =  ev.target.value

    let y, d, m
    let year = state.get('year')

    let out = /^(\d\d?)[\/\-](\d\d?)[\/\-](\d\d\d\d)$/.exec(val)
    if (out) {
      y = parseInt(out[3])
      d = parseInt(out[2])
      m = parseInt(out[1])
    }

    out = /^(\d\d?)[\/\-](\d\d?)[\/\-](\d\d)$/.exec(val)
    if (out) {
      y = parseInt(out[3]) + 2000
      d = parseInt(out[2])
      m = parseInt(out[1])
    }

    out = /^(\d\d?)[\/\-](\d\d?)$/.exec(val)
    if (out) {
      y = year
      d = parseInt(out[2])
      m = parseInt(out[1])
    }

    if (y >= 2000 && y <= 2099 && m > 0 && m < 13 && d > 0 && d < 32) {
      try {
        const date = moment([y, m, d])
        return state.set('year', y).set('month', m-1).set('date', d).set('active', false)
      } catch (e) {
        return state.set('active', false)
      }
    } else {
      return state.set('active', false)
    }
  })

  const calendar_date_r = inputs.calendar_date$.map(val => state => {
    return state
      .set('date', val.date())
      .set('month', val.month())
      .set('year', val.year())
  })

  return O.merge(click_r, blur_r, calendar_date_r, change_month_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(date => {
      console.log('initializing', date)
      const init = {
        active: undefined,
        calendar_month: date ? date.month() : moment().month(),
        calendar_year: date ? date.year() : moment().year(),
        month: date ? date.month() : undefined,
        date: date ? date.date() : undefined,
        year: date ? date.year() : undefined
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => clone(x.toJS()))
    .do(x => console.log('date input', x))
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({state$, components: combineObj(components)})
    .map((info: any) => {
      const {state, components} = info
      const {calendar_year, calendar_month, year, month, date, active} = state
      const out = (year && month >= 0 && date) ? moment([year, month,date]) : undefined
      const {calendar} = components
      return div('.date-input.form-group.dropdown', {class: {open: !!active}}, [
        input('.appDateInput.form-control', {
          hook: {
            update: (vNode, {elm}) => {
              elm.value = out ? out.format('M/D/YYYY') : ''
            }
          },
          attrs: {
            type: 'text', 
            value: out ? out.format('M/D/YYYY') : undefined
          }
        }),
        div('.appDateDropdown.dropdown-menu', [
          div(`.calendar-controller.d-flex.fx-j-sa`, [
            div(`.appDecMonth.btn.btn-link.fa.fa-angle-left.fa-2x`, []),
            div(`.flex-center`, [moment([calendar_year, calendar_month]).format('MMM YYYY')]),
            div(`.appIncMonth.btn.btn-link.fa.fa-angle-right.fa-2x`, []) 
          ]),
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
    Global: actions.blur_to_dropdown$.map(ev => {
      return {
        type: 'preventDefault',
        data: ev
      }
    }),
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
