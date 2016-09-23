import {Observable as O} from 'rxjs'
import {div, input, span, table, thead, tfoot, tbody, td, tr, button} from '@cycle/dom'
import moment from 'moment'
import {between, notBetween, combineObj, spread} from '../../utils'
import {getMomentFromStateInfo, getDateFromStateInfo, AM, PM} from './utils'

function daysInMonth(state) {
  return moment((new Date(state.year, state.month + 1)).toISOString()).subtract(1, 'days').date()
}

function startDayForMonth(state) {
  return moment((new Date(state.year, state.month)).toISOString()).day()
}

function inValidRange() { return true }

// function inValidRange(today, {year, month, rangeStart, rangeEnd}, dayNum) {

//   let rangeStartPass = true
//   if (rangeStart) {
//     const testDay = moment((new Date(year, month, dayNum)).toISOString()).endOf('day')
//     rangeStartPass = rangeStart.isSameOrBefore(testDay)
//   }

//   let rangeEndPass = true
//   if (rangeEnd) {
//     const testDay = moment((new Date(year, month, dayNum)).toISOString()).startOf('day')
//     rangeEndPass = rangeEnd.isSameOrAfter(testDay)
//   }

//   return rangeStartPass && rangeEndPass //&& today.isSameOrBefore(testDay)
// }

// function isPreviousMonthSelectable({year, month, rangeStart}) {
//   if (rangeStart) {
//     return moment((new Date(year, month-1)).toISOString()).endOf('month').isAfter(rangeStart)
//   }

//   return true
// }

// function isNextMonthSelectable({year, month, rangeEnd}) {
//   if (rangeEnd) {
//     return moment((new Date(year, month+1)).toISOString()).startOf('month').isSameOrBefore(rangeEnd)
//   }

//   return true
// }

// function isPreviousYearSelectable({year, month, rangeStart}) {
//   if (rangeStart) {
//     return moment((new Date(year-1, month)).toISOString()).endOf('month').isAfter(rangeStart)
//   }

//   return true
// }

// function isNextYearSelectable({year, month, rangeEnd}) {
//   if (rangeEnd) {
//     return moment((new Date(year+1, month)).toISOString()).startOf('month').isSameOrBefore(rangeEnd)
//   }

//   return true
// }

function getCurrentMonthName({year, month, date}) {
  return moment((new Date(year, month, date)).toISOString()).format(`MMMM`)
}

function isSelected(year, month, day, selected) {
  return selected.some((d) => {
    return d.year === year && d.month === month && d.date === day
  })
}

function renderCalendar(state) {
  const startDayOfMonth = startDayForMonth(state)
  const lastDayOfMonth = daysInMonth(state)
  const firstDayOffset = startDayOfMonth
  const lastDayOffset = firstDayOffset + lastDayOfMonth
  const today = moment((new Date()).toISOString()).startOf('day')


  const weeks = lastDayOffset === 28 ? [0, 1, 2, 3] : lastDayOffset < 35 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5]
  const dayNameAbbrs = [`Su`, `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa`]

  let currDay = firstDayOffset
  let dayNum = 1

  let month = state.month
  let year = state.year
  return div(`.selection-calendar`, [
    table(`.calendar-table`, [
      thead([
        tr(
          dayNameAbbrs.map(d => td([
            div([
              span([d])
            ])
          ]))
        )
      ]),
      tbody(weeks.map(week => {
        return tr(`.week-${week}`, [0, 1, 2, 3, 4, 5, 6].map(day => {
          if (currDay === week*7+day && currDay >= firstDayOffset && currDay < lastDayOffset) {
            let out
            const selected = isSelected(year, month, dayNum, state.selected) ? `.selected` : ``
            let temp = today.date()
            temp = today.month()
            temp = today.year()
            const isToday = dayNum === today.date() && month === today.month() && year === today.year()
            if (inValidRange(today, state, dayNum)) {
              out = td([
                div([
                  span(
                    `.appSelectable${selected || '.selectable'}.day-${day}.calendar-day${isToday ? '.today' : ''}`,
                    {attrs: {'data-date': new Date(year, month, dayNum)}},
                    [dayNum++]
                  )
                ])
              ])
            } else {
              out = td([
                div([
                  span(`.not-selectable${selected}.day-${day}`, [dayNum++])
                ])
              ])
            }

            currDay++

            return out
          } else {
            return td(`.hidden-cell`)
          }
        }))
      }))
    ])
  ])
}

export default function view(state$) {
  return state$.map(renderCalendar)
}
