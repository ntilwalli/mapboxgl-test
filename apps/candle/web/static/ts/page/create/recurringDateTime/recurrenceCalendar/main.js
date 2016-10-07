import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/DOM'
import moment from 'moment'
import {combineObj, spread, normalizeComponent, normalizeSink, createProxy} from '../../../../utils'

import SelectionCalendar from '../../../../library/selectionCalendar/main'

function intent(sources) {
  const {DOM} = sources
  const nextMonth$ = DOM.select('.appNextMonth').events('click').mapTo(1)
  const prevMonth$ = DOM.select('.appPrevMonth').events('click').mapTo(-1)
  return {
    changeMonth$: O.merge(
      nextMonth$,
      prevMonth$
    )
  }
}

function isPreviousMonthSelectable({year, month, rangeStart}) {
  if (rangeStart) {
    return moment((new Date(year, month-1)).toISOString()).endOf('month').isAfter(rangeStart)
  }

  return true
}

function isNextMonthSelectable({year, month, rangeEnd}) {
  if (rangeEnd) {
    return moment((new Date(year, month+1)).toISOString()).startOf('month').isSameOrBefore(rangeEnd)
  }

  return true
}

function getCurrentMonthName({year, month}) {
  return moment((new Date(year, month)).toISOString()).format(`MMMM`)
}

const PREV_MONTH_STYLE = `.fa.fa-angle-left.fa-2x`
const NEXT_MONTH_STYLE = `.fa.fa-angle-right.fa-2x`

function renderNavigator(state) {
  const prevMonthSelectable = !isPreviousMonthSelectable(state) ? `.disabled` : ``
  const nextMonthSelectable = !isNextMonthSelectable(state) ? `.disabled` : ``
  return div(`.calendar-navigator`, [
    span([
      button(`.appPrevMonth${prevMonthSelectable}`,[
        span(`${PREV_MONTH_STYLE}`)
      ])
    ]),
    span(`.current-month`, [
      span([getCurrentMonthName(state)]), span(`.current-year`, [state.year])
    ]),
    span([
      button(`.appNextMonth${nextMonthSelectable}`,[
        span(`${NEXT_MONTH_STYLE}`)
      ])
    ])
  ])
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map(info => {
      const {components} = info
      return div(`.recurrence-calendar`, [
        renderNavigator(info.state),
        components.selectionCalendar
      ])
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const sharedProps$ = inputs.props$.publishReplay(1).refCount()
  const sc = SelectionCalendar(sources, {
      props$: sharedProps$
    })
  const components = {
    selectionCalendar$: sc.DOM
  }
  return {
    DOM: view(sharedProps$, components),
    action$: O.merge(
      actions.changeMonth$.map(x => ({
        type: `changeMonth`,
        data: x
      }))
    )
  }
}