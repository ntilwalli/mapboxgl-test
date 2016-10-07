import {Observable as O} from 'rxjs'
import {div, input, span, table, thead, tfoot, tbody, td, tr, button} from '@cycle/dom'
import moment from 'moment'
import {between, notBetween, combineObj, spread} from '../../utils'
import {getMomentFromStateInfo, getTimeFromStateInfo, AM, PM} from './utils'

function isPreviousHourSelectable({currentTime, rangeStart}) {
  if (currentTime && rangeStart) {
    return getMomentFromStateInfo(currentTime).subtract(1, 'hour').isSameOrAfter(rangeStart)
  }

  return true
}

function isNextHourSelectable({currentTime, rangeEnd}) {
  if (currentTime && rangeEnd) {
    return getMomentFromStateInfo(currentTime).add(1, 'hour').isSameOrBefore(rangeEnd)
  }

  return true
}

function isPreviousMinuteSelectable({currentTime, rangeStart}) {
  if (currentTime && rangeStart) {
    return getMomentFromStateInfo(currentTime).subtract(1, 'minute').isSameOrAfter(rangeStart)
  }

  return true
}

function isNextMinuteSelectable({currentTime, rangeEnd}) {
  if (currentTime && rangeEnd) {
    return getMomentFromStateInfo(currentTime).add(1, 'minute').isSameOrBefore(rangeEnd)
  }

  return true
}

function isPMSelectable({currentTime, rangeEnd}) {
  if (currentTime && rangeEnd) {
    return getMomentFromStateInfo(currentTime).add(12, 'hour').isSameOrBefore(rangeEnd)
  }

  return true
}

function isAMSelectable({currentTime, rangeStart}) {
  if (currentTime && rangeStart) {
    return getMomentFromStateInfo(currentTime).subtract(12, 'hour').isSameOrAfter(rangeStart)
  }

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
      div([state.currentTime ? state.currentTime.mode : `_.M.`]),
      div(`.appDecrementMeridiem${DEC_STYLE}.selectable${mode === AM ? pmSelectable : amSelectable}`)
    ])
  ])
}

export default function view(state$) {
  return state$.map(renderClock)
}
