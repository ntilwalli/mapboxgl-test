import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, span, button, input, select, option} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, between, notBetween, globalUID} from '../utils'
import moment = require('moment')
import deepEqual = require('deep-equal')
import clone = require('clone')

const UP_KEYCODE = 38
const DOWN_KEYCODE = 40
const ENTER_KEYCODE = 13
const ESC_KEYCODE = 27
const TAB_KEYCODE = 9

function intent(sources) {
  const {DOM} = sources
  const guid = globalUID()

  const click$ = DOM.select('.appTimeInput').events('click').publish().refCount()
  const keydown$ = DOM.select('.appTimeInput').events('keydown').publish().refCount()

  const enter_pressed$ = keydown$
    .filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const esc_pressed$ = keydown$
    .filter(({keyCode}) => keyCode === ESC_KEYCODE)

  const click_elsewhere$ = DOM.select('body').events('click')
    .filter(ev => {
      return ev.guid !== guid
    })
    .withLatestFrom(click$, (_, ev) => {
      return ev
    })

  const dropdown_click$ = DOM.select('.appTimeDropdown').events('click')

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

  const clear$ = sources.DOM.select(`.appClearButton`).events('click')

  return {
    click$,
    clear$,
    //blur_to_dropdown$,
    close_dropdown$: O.merge(click_elsewhere$, enter_pressed$, esc_pressed$),
    hour$,
    minute$,
    meridiem$,
    add_event_guid$: O.merge(click$, dropdown_click$)
      .map(ev => {
        return {
          event: ev,
          guid
        }
      })
  }
}

function reducers(actions, inputs) {

  const click_r = actions.click$.map(_ => state => {
    return state.set('active', true)
  })

  const close_dropdown_r = actions.close_dropdown$.map(ev => state => {
    const val =  ev.target.value

    let h, m
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
      return state
        .set('input_hour', input_hour)
        .set('input_minute', m)
        .set('input_meridiem', input_meridiem)
        .set('hour', h)
        .set('minute', m)
        .set('active', false)
    } else {
      return state.set('active', false)
    }
  })

  const hour_r = actions.hour$.map(input_hour => state => {
    const meridiem = state.get('input_meridiem')
    if (input_hour) {
      const parsed = parseInt(input_hour)
      if (meridiem) {
        const hour = getMilitaryHour(parsed, meridiem)
        return state.set('hour', hour).set('input_hour', parsed)
      } else {
        return state.set('input_hour', parsed)
      }
    } else {
      return state.set('input_hour', undefined).set('hour', undefined)
    }
  })

  const minute_r = actions.minute$.map(input_minute => state => {
    if (input_minute) {
      const parsed = parseInt(input_minute)
      return state.set('input_minute', input_minute).set('minute', parsed)
    } else {
      return state.set('input_minute', undefined).set('minute', undefined)
    }
  })

  const meridiem_r = actions.meridiem$.map(meridiem => state => {
    if (meridiem) {
      const input_hour = state.get('input_hour')
      if (input_hour) {
        const hour = getMilitaryHour(input_hour, meridiem)
        return state.set('input_meridiem', meridiem).set('hour', hour)
      } else {
        return state.set('input_meridiem', meridiem)
      }
    } else {
      return state.set('input_meridiem', meridiem).set('hour', undefined)
    }
  })

  const clear_r = actions.clear$.map(_ => state => {
    return state
      .set('input_meridiem', undefined)
      .set('input_minute', undefined)
      .set('input_hour', undefined)
      .set('hour', undefined)
      .set('minute', undefined)
  })

  return O.merge(click_r, close_dropdown_r, hour_r, minute_r, meridiem_r, clear_r)
}

function getMilitaryHour(hour, meridiem) {
  return meridiem === 'AM' ? hour === 12 ? 0 : hour : hour === 12 ? 12 : hour + 12
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap((info: any) => {
      let style_class, time
      if (info !== null && typeof info === 'object' && info.hasOwnProperty('style_class')) {
        style_class = info.style_class
        time = info.time
      } else {
        style_class = '.form-control'
        time = info
      }

      //console.log('initializing', time)
      const init = {
        active: undefined,
        input_hour: time ? time.hour === 0 ? 12 : time.hour > 12 ? time.hour - 12 : time.hour : undefined,
        input_minute: time ? time.minute : undefined,
        input_meridiem: time ? time.hour >= 12 ? "PM" : "AM" : undefined,
        hour: time ? time.hour : undefined,
        minute: time ? time.minute : undefined,
        style_class
      }

      return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .do(x => {
      console.log('time input', x)
    })
    .publishReplay(1).refCount()
}

function view(state$, props_style_class) {
  return state$
    .map((state: any) => {
      const style_class = props_style_class || ''
      const {input_hour, input_minute, input_meridiem, hour, minute, active} = state
      const out = (hour >= 0 && minute >= 0) ? moment().hour(hour).minute(minute) : undefined
      return div('.bootstrap-time-input.dropdown', {class: {show: !!active}}, [
        input('.appTimeInput.time-input.form-control.form-control' + style_class, {
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
        div('.appTimeDropdown.time-input-dropdown.dropdown-menu', [
          //div('.row', [
          //  div('.col-12.d-flex', [
            div('.d-fx-a-c', [
              select(
                `.appHourSelect.form-control.form-control.mr-xs` + style_class, 
                {style: {widtH: "5rem"}},
                [undefined, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(opt => {
                  return option({attrs: {value: opt, selected: input_hour === opt}}, [
                    opt ? opt.toString() : ''
                  ])
                })
              ),
              ':',
              select(
                `.appMinuteSelect.form-control.form-control.ml-xs` + style_class, 
                {style: {widtH: "5rem"}},
                [
                  undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 
                  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
                  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
                  30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
                  40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
                  50, 51, 52, 53, 54, 55, 56, 57, 58, 59
                ].map(opt => {
                  return option({attrs: {value: opt, selected: input_minute === opt}}, [
                    opt === undefined ? '' : opt < 10 ? '0' + opt.toString() : opt.toString()
                  ])
                })
              ),
              select(
                `.appMeridiemSelect.form-control.form-control.ml-xs` + style_class, 
                {style: {widtH: "5rem"}},
                [undefined, 'AM', 'PM'].map(opt => {
                  return option({attrs: {value: opt, selected: input_meridiem === opt}}, [
                    opt ? opt : ''
                  ])
                })
              ),
              button('.appClearButton.btn.btn-link.d-fx-a-c.ml-4', ['Clear'])
            ])
          ])
        ])
      //])
  })

}


export default function  main(sources, props$, style_class?) {
  const actions = intent(sources)
  const state$ = model(actions, {props$})

  return {
    DOM: view(state$, style_class),
    Global: actions.add_event_guid$.map(data => {
      return {
        type: 'addEventGuid',
        data
      }
    }),
    output$: state$
      // .filter(state => {
      //   const {hour, minute} = state
      //   return hour >= 0 && minute >= 0
      // })
      .map(state => {
        const {hour, minute} = state
        return hour >= 0 && minute >= 0 ? {hour, minute} : undefined
      })
      .distinctUntilChanged((x, y) => x && y && deepEqual(x, y))
  }
}
