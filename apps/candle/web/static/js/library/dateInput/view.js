import xs from 'xstream'
import combineObj from 'xs-combine-obj'
import {div, input, span, table, thead, tfoot, tbody, td, tr, button} from '@cycle/dom'
import moment from 'moment'

function daysInMonth(state) {
  return moment((new Date(state.year, state.month + 1)).toISOString()).subtract(1, 'days').date()
}

function startDayForMonth(state) {
  return moment((new Date(state.year, state.month)).toISOString()).day()
}

function inValidRange(today, {year, month, rangeStart, rangeEnd}, dayNum) {
  const testDay = new Date(year, month, dayNum)
  let rangeStartPass = true
  if (rangeStart) {
    rangeStartPass = moment(rangeStart.toISOString()).isSameOrBefore(testDay)
  }

  let rangeEndPass = true
  if (rangeEnd) {
    rangeEndPass = moment(rangeEnd.toISOString()).isSameOrAfter(testDay)
  }

  return rangeStartPass && rangeEndPass && today.isSameOrBefore(testDay)
}

function isPreviousMonthSelectable({year, month}) {
  return moment((new Date(year, month-1)).toISOString()).endOf('month').isAfter(new Date())
}

function isNextMonthSelectable({year, month}) {
  return moment((new Date(year, month+1)).toISOString()).startOf('month').isAfter(new Date())
}

function isPreviousYearSelectable({year, month}) {
  return moment((new Date(year-1, month)).toISOString()).endOf('month').isAfter(new Date())
}

function isNextYearSelectable({year, month}) {
  return moment((new Date(year+1, month)).toISOString()).startOf('month').isAfter(new Date())
}

function getCurrentMonthName({year, month, date}) {
  return moment((new Date(year, month, date)).toISOString()).format(`MMMM`)
}

function renderCalendar(state) {
  const startDayOfWeek = startDayForMonth(state)
  const lastDayOfMonth = daysInMonth(state)
  const firstDayOffset = startDayOfWeek
  const lastDayOffset = firstDayOffset + lastDayOfMonth
  const today = moment((new Date()).toISOString()).startOf('day')


  const weeks = lastDayOffset === 28 ? [0, 1, 2, 3] : lastDayOffset < 35 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5]
  const dayNameAbbrs = [`Su`, `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa`]

  let currDay = firstDayOffset
  let dayNum = 1

  let selectedDay = state.currentDate && state.currentDate.month === state.month ? state.currentDate.date : null
  let month = state.month
  let year = state.year
  return table(`.calendar-table`, [
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
          const selected = dayNum === selectedDay ? `.selected` : ``
          if (inValidRange(today, state, dayNum)) {
            out = td([
              div([
                span(
                  `.appSelectable${selected || '.selectable'}.day-${day}.calendar-day`,
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
}

const INC_STYLE = `.fa.fa-angle-up.fa-2x`
const DEC_STYLE = `.fa.fa-angle-down.fa-2x`

function renderClock({state}) {
  return div(`.time-input-section`, [
    span(`.hour-section`, [
      div(`.appIncrementHour${INC_STYLE}.selectable`),
      div([state.currentTime.hour]),
      div(`.appDecrementHour${DEC_STYLE}.selectable`)
    ]),
    span(`.minute-section`, [
      div([`:`]),
    ]),
    span(`.minute-section`, [
      div(`.appIncrementMinute${INC_STYLE}.selectable`),
      div([`${state.currentTime.minute < 10 ? '0' : ''}${state.currentTime.minute}`]),
      div(`.appDecrementMinute${DEC_STYLE}.selectable`)
    ]),
    span(`.mode-section`, [
      div(`.appChangeMode${INC_STYLE}.selectable`),
      div([state.currentTime.mode]),
      div(`.appChangeMode${DEC_STYLE}.selectable`)
    ]),
    //div([
      // span([components.hour]),
      // span([`:`]),
      // span([components.minute])
    //])
  ])
}

const PREV_YEAR_STYLE = `.fa.fa-angle-double-left.fa-2x`
const NEXT_YEAR_STYLE = `.fa.fa-angle-double-right.fa-2x`
const PREV_MONTH_STYLE = `.fa.fa-angle-left.fa-2x`
const NEXT_MONTH_STYLE = `.fa.fa-angle-right.fa-2x`

function renderPicker(inputs) {
  const {state} = inputs
  const prevMonthSelectable = !isPreviousMonthSelectable(state) ? `.disabled` : ``
  const nextMonthSelectable = !isNextMonthSelectable(state) ? `.disabled` : ``
  return div(`.appSelector.selector`, [
    div(`.calendar`, [
      div(`.calendar-navigator`, [
        // button(`.appPrevYear${}`,[
        //   span(`${PREV_YEAR_STYLE}`)
        // ]),
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
        //, button(`.appNextYear`,[
        //   span(`${NEXT_YEAR_STYLE}`)
        // ])
      ]),
      div([
        renderCalendar(state)
      ])
    ]),
    div(`.clock`, [
      //span({style: {display: `flex`, flex: `1 1 auto`, 'justify-content': `center`}}, [
        renderClock(inputs)
      //])
    ])

  ])
}

export default function view(state$, components) {
  return combineObj({
    state$//,
    //components$: combineObj(components)
  }).map(inputs => {
    const {state} = inputs
    const {placeholder, currentTime, currentDate} = state

    let current = undefined
    if (currentTime && currentDate) {
      const {year, month, date} = currentDate
      const {hour, minute, mode} = currentTime
      current = moment((new Date(year, month, date, mode === `P.M.` ? (hour === 12 ? hour : hour + 12) : (hour === 12 ? 0 : hour), minute)).toISOString())
    }

    return div(`.date-time-input-component`, [
      input(`.appInputable.date-input`, {
        props: {
          type: `text`,
          placeholder: placeholder || ``
        },
        hook: {
          create: (emptyVNode, {elm}) => {
            if (current) {
              elm.value = current.format("dddd, MMMM Do YYYY, h:mm a")
            }
          },
          update: (old, {elm}) => {
            if (current) {
              elm.value = current.format("dddd, MMMM Do YYYY, h:mm a")
            }
          }
        }
      }),
      state.displayPicker ? renderPicker(inputs) : null
    ])
  })
}
