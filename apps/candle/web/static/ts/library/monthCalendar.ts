import {Observable as O} from 'rxjs'
import {div, svg} from '@cycle/dom'
import Immutable = require('immutable')
import moment = require('moment')
import {combineObj} from '../utils'

const {g, rect, text} = svg

function intent(sources) {
  const {DOM} = sources

  return {
    click$: DOM.select(`.appDay`).events(`click`).map(ev => moment(new Date(ev.target.getAttribute("data-date"))))
  }
}

function reducers(actions, inputs) {
  return O.merge(O.never())
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      props: inputs.props$
    })
    .switchMap((info: any) => {
      const {props} = info
      const init = props
      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function getWeeksArray(year, month) {
  const start_of_month = moment([year, month, 1]);
  const end_of_month = start_of_month.clone().endOf('month')
  let curr = start_of_month.clone()

  // console.log({
  //   year, month,
  //   start_of_month,
  //   end_of_month
  // })
   
  const out = []
  let week
  let done = false
  let x = 0;
  while (true) {
    for (let i = 0; i < 7; i++) {
      if (i === 0) {
        week = []
      }

      if (i === curr.day() && !done) {
        week.push(curr)
        //console.log(curr.date())

        if (curr.date() === end_of_month.date()) {
          done = true
        } else {
          curr = curr.clone().add(1, 'day')
        }
      } else {
        //console.log(`null`)
        week.push(null)
      }

      if (i === 6) {
        out.push(week)
        //console.log(`end of month`, end_of_month.date())
        //console.log(`curr`, curr.date())
        if (done) {
          //console.log(`done`)
          return out
        }
      }
    }
  }
}

const day_width = 40;
const day_margin = 3;
const day_full_width = day_width + day_margin

const getCalendarWidth = (weeks_array) => day_width + (day_full_width * 6)
const getCalendarHeight = (weeks_array) => day_width + (day_full_width * (weeks_array.length - 1))

function renderDay(day, day_index, selected, today, selectable) {
  const class_info = day ? {
    today: today.isSame(day, `day`),
    selected: !!(selected && selected.some(x => x.isSame(day, `day`))),
    selectable
  } : undefined

  const style_info = day ? undefined : {
    visibility: `hidden`
  }

  const attrs_info = day ? {
    "data-date": day
  } : undefined

  const children = day ? [day.date()] : []

  return div(`.appDay.day`, {
      attrs: attrs_info,
      style: style_info,
      class: class_info
    }, children)
}

const isSelectable = (day, rangeStart, rangeEnd, today) => {
  if (rangeStart && day.isBefore(rangeStart)) {
    return false
  }

  if (rangeEnd && day.isAfter(rangeEnd)) {
    return false
  }

  if (day.isBefore(today)) {
    return false
  }

  return true

}

function renderWeeksArray(state, weeks_array, today) {
  const {year, month, selected} = state
  const out = weeks_array.map((week, week_index) => {
      const {rangeStart, rangeEnd} = state
      const today = moment().startOf('day')
      return div(
        `.week`, {
          style: {
            justifyContent: week_index === weeks_array.length - 1 ? `flex-start` : `flex-end`
          }
        },
        week.map((day, day_index) => renderDay(day, day_index, selected, today, day ? isSelectable(day, rangeStart, rangeEnd, today) : false))
      )
    })

  return out
}

function renderWeekdays() {
  return div(`.day-names`, [`Su`, `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa`].map(x => {
    return div(`.day-name`, [x])
  }))
}

function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {year, month, selected} = state
      const weeks_array = getWeeksArray(year, month)
      const num_weeks = weeks_array.length
      const today = moment()
      const children = renderWeeksArray(state, weeks_array, today)
      const out = div(`.month-calendar`, [
        renderWeekdays(),
        div(`.weeks`, children)
      ])

      return out
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$, {})
  return {
    DOM: vtree$,
    output$: actions.click$
  }
}