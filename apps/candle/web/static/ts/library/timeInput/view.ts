import {Observable as O} from 'rxjs'
import {div, input, span, table, thead, tfoot, tbody, td, tr, button} from '@cycle/dom'
import moment = require('moment')
import {between, notBetween, combineObj, spread} from '../../utils'
import {getTimeFromStateInfo, AM, PM} from './utils'

function isPreviousHourSelectable({currentTime}) {
  return true
}

function isNextHourSelectable({currentTime}) {
  return true
}

function isPreviousMinuteSelectable({currentTime}) {
  return true
}

function isNextMinuteSelectable({currentTime}) {
  return true
}

function isPMSelectable({currentTime}) {
  return true
}

function isAMSelectable({currentTime}) {
  return true
}

const INC_STYLE = `.fa.fa-angle-up.fa-2x`
const DEC_STYLE = `.fa.fa-angle-down.fa-2x`

function getHour(ct) {
  if (!ct) {
    return `_`
  } else {
    return `${ct.hour}`
  }
}

function getMinute(ct) {
  if (!ct) {
    return `__`
  } else {
    return `${ct.minute < 10 ? '0' : ''}${ct.minute}`
  }
}

function renderClock(state) {
  const prevHourSelectable = !isPreviousHourSelectable(state) ? `.disabled` : ``
  const nextHourSelectable = !isNextHourSelectable(state) ? `.disabled` : ``
  const prevMinuteSelectable = !isPreviousMinuteSelectable(state) ? `.disabled` : ``
  const nextMinuteSelectable = !isNextMinuteSelectable(state) ? `.disabled` : ``
  const amSelectable = !isAMSelectable(state) ? `.disabled` : ``
  const pmSelectable = !isPMSelectable(state) ? `.disabled` : ``
  const mode = state.currentTime ? state.currentTime.mode : undefined
  return div(`.time-input-component`, [
    div(`.clock-section`, [
      span(`.hour-section`, [
        div(`.appIncrementHour${INC_STYLE}.selectable${nextHourSelectable}`),
        div([getHour(state.currentTime)]),
        div(`.appDecrementHour${DEC_STYLE}.selectable${prevHourSelectable}`)
      ]),
      span(`.minute-section`, [
        div([`:`]),
      ]),
      span(`.minute-section`, [
        div(`.appIncrementMinute${INC_STYLE}.selectable${nextMinuteSelectable}`),
        div([getMinute(state.currentTime)]),
        div(`.appDecrementMinute${DEC_STYLE}.selectable${prevMinuteSelectable}`)
      ]),
      span(`.mode-section`, [
        div(`.appIncrementMeridiem${INC_STYLE}.selectable${mode === AM ? pmSelectable : amSelectable}`),
        div([state.currentTime ? state.currentTime.mode : `_M`]),
        div(`.appDecrementMeridiem${DEC_STYLE}.selectable${mode === AM ? pmSelectable : amSelectable}`)
      ])
    ]),
    div(`.clear-button-section`, [
      span(`.appClearTime.text-button`, [
        `clear`
      ])
    ])
  ])
}

export default function view(state$) {
  return state$.map(renderClock)
}
