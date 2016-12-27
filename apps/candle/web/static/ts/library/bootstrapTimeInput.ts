import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, span, button, input, select, option} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, between, notBetween} from '../utils'
import DateInputMonthCalendar from '../library/dateInputMonthCalendar'
import moment = require('moment')
import clone = require('clone')

const UP_KEYCODE = 38
const DOWN_KEYCODE = 40
const ENTER_KEYCODE = 13
const ESC_KEYCODE = 27
const TAB_KEYCODE = 9

function intent(sources) {
  const {DOM} = sources

  const click$ = DOM.select('.appTimeInput').events('click')
  const keydown$ = DOM.select('.appTimeInput').events('keydown').publish().refCount()

  const enter_pressed$ = keydown$
    .filter(({keyCode}) => keyCode === ENTER_KEYCODE)

  const input_blur$ = DOM.select('.appTimeInput').events('blur')
    .do(ev => console.log('blur$'))
    .publish().refCount()
  const dropdown_mousedown$ = DOM.select('.appTimeDropdown').events('mousedown')
    .do(x => console.log('mousedown$'))
    .publish().refCount()
  const dropdown_mouseup$ = DOM.select('.appTimeDropdown').events('mouseup')
    .do(x => console.log('mouseup$'))
    .publish().refCount()

  const blur_to_dropdown$ = input_blur$
    //.do(x => console.log(`blur to dropdown`))
    .let(between(dropdown_mousedown$, dropdown_mouseup$))
  const blur_to_elsewhere$ = input_blur$
    //.do(x => console.log(`blur to elsewhere`))
    .let(notBetween(dropdown_mousedown$, dropdown_mouseup$))

  const hour$ = sources.DOM.select(`.appHourSelect`).events('change')
    .map(ev => {
      return ev.target.value
    })

  const minute$ = sources.DOM.select(`.appMinuteSelect`).events('change')
    .map(ev => {
      return ev.target.value
    })

  const meridiem$ = sources.DOM.select(`.appMeridiemSelect`).events('change')
    .map(ev => {
      return ev.target.value
    })

  return {
    click$,
    blur_to_dropdown$,
    close_dropdown$: O.merge(blur_to_elsewhere$, enter_pressed$),
    hour$,
    minute$,
    meridiem$
  }
}

function reducers(actions, inputs) {

  const click_r = actions.click$.map(_ => state => {
    return state.set('active', true)
  })

  const close_dropdown_r = actions.close_dropdown$.map(ev => state => {
    const val =  ev.target.value

    let h, m
    let year = state.get('year')
    let meridiem = 'P'
    let out = /^(\d\d?):(\d\d) ?(a|p).?m.?$/i.exec(val)
    if (out) {
      meridiem = out[3].toUpperCase() + 'M'
      h = getMilitaryHour(parseInt(out[1]), meridiem)
      m = parseInt(out[2])
    }

    out = /^(\d\d?):?(\d\d)$/.exec(val)
    if (out) {
      h = parseInt(out[1])
      m = parseInt(out[2])
    }

    out = /^(\d\d?) ?(a|p).?m.?$/i.exec(val)
    if (out) {
      meridiem = out[2].toUpperCase() + 'M'
      h = getMilitaryHour(parseInt(out[1]), meridiem)
      m = 0
    }


    out = /^(\d\d?)$/.exec(val)
    if (out) {
      const val = parseInt(out[1])
      h = val === 12 ? val : val + 12
      m = 0
    }

    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        const input_hour = h === 0 ? 12 : h > 12 ? h - 12 : h
        const input_meridiem =  h >= 12 ? "PM" : "AM"
      return state.set('input_hour', input_hour).set('input_minute', m).set('input_meridiem', input_meridiem).set('hour', h).set('minute', m).set('active', false)
    } else {
      return state.set('active', false)
    }
  })

  const hour_r = actions.hour$.map(input_hour => state => {
    const parsed = parseInt(input_hour)

    const meridiem = state.get('input_meridiem')

    const hour = getMilitaryHour(parsed, meridiem)
    return state.set('hour', hour).set('input_hour', parsed)
  })

  const minute_r = actions.minute$.map(input_minute => state => {
    const parsed = parseInt(input_minute)
    return state.set('input_minute', input_minute).set('minute', parsed)
  })

  const meridiem_r = actions.meridiem$.map(meridiem => state => {
    const hour = getMilitaryHour(state.get('input_hour'), meridiem)
    return state.set('input_meridiem', meridiem).set('hour', hour)
  })

  return O.merge(click_r, close_dropdown_r, hour_r, minute_r, meridiem_r)
}

function getMilitaryHour(hour, meridiem) {
  return meridiem === 'AM' ? hour === 12 ? 0 : hour : hour === 12 ? 12 : hour + 12
}



function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(time => {
      console.log('initializing', time)
      const init = {
        active: undefined,
        input_hour: time ? time.hour === 0 ? 12 : time.hour > 12 ? time.hour - 12 : time.hour : 12,
        input_minute: time ? time.minute : 0,
        input_meridiem: time ? time.hour >= 12 ? "PM" : "AM" : "PM",
        hour: time ? time.hour : 12,
        minute: time ? time.minute : 0  
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .do(x => console.log('time input', x))
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$
    .map((state: any) => {
      const {input_hour, input_minute, input_meridiem, hour, minute, active} = state
      const out = (hour >= 0 && minute >= 0) ? moment().hour(hour).minute(minute) : undefined
      return div('.time-input.dropdown', {class: {open: !!active}}, [
        input('.appTimeInput.form-control.form-control-sm', {
          hook: {
            update: (vNode, {elm}) => {
              elm.value = out ? out.format('h:mm a') : ''
            }
          },
          attrs: {
            type: 'text', 
            value: out ? out.format('h:mm a') : undefined
          }
        }),
        div('.appTimeDropdown.dropdown-menu', [
          div('.row', [
            div('.col-xs-12.d-flex', [
              select(
                `.appHourSelect.form-control.form-control-sm`, 
                {style: {widtH: "5rem"}},
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(opt => {
                  return option({attrs: {value: opt, selected: input_hour === opt}}, [
                    opt.toString()
                  ])
                })
              ),
              select(
                `.appMinuteSelect.form-control.form-control-sm`, 
                {style: {widtH: "5rem"}},
                [
                  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 
                  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
                  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
                  30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
                  40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
                  50, 51, 52, 53, 54, 55, 56, 57, 58, 59
                ].map(opt => {
                  return option({attrs: {value: opt, selected: input_minute === opt}}, [
                    opt < 10 ? '0' + opt.toString() : opt.toString()
                  ])
                })
              ),
              select(
                `.appMeridiemSelect.form-control.form-control-sm`, 
                {style: {widtH: "5rem"}},
                ['AM', 'PM'].map(opt => {
                  return option({attrs: {value: opt, selected: input_meridiem === opt}}, [
                    opt
                  ])
                })
              )
            ])
          ])
        ])
      ])
  })

}


export default function  main(sources, props$) {
  const actions = intent(sources)
  const calendar_date$ = createProxy()
  const state$ = model(actions, {props$, calendar_date$})

  return {
    DOM: view(state$),
    Global: actions.blur_to_dropdown$.map(ev => {
      return {
        type: 'preventDefault',
        data: ev
      }
    }),
    output$: state$
      .filter(state => {
        const {hour, minute} = state
        return hour >= 0 && minute >= 0
      })
      .map(state => {
        const {hour, minute} = state
        return {hour, minute}
      })
  }
}