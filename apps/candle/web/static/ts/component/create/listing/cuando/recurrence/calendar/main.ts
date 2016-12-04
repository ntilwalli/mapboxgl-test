import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import moment = require('moment')
import {combineObj} from '../../../../../../utils'
import {RRule, RRuleSet} from 'rrule'
import {getActualRRule} from '../helpers'
import MonthCalendar from '../../../../../../library/monthCalendar'

function intent(sources) {
  const {DOM} = sources

  return {
    change_month$: O.merge(
      DOM.select(`.appIncMonth`).events(`click`).mapTo(1),
      DOM.select(`.appDecMonth`).events(`click`).mapTo(-1)
    )
  }
}

function reducers(actions, inputs) {
  const cuando_r = inputs.props$.skip(1).map(x => state => {
    return state.set(`recurrence`, x)
  })

  const change_month_r = actions.change_month$.map(inc => state => {
    let month = state.get(`month`)
    let year = state.get(`year`)

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

    return state.set(`month`, month).set(`year`, year)
  })

  return O.merge(cuando_r, change_month_r)
}

function recurrenceToRRuleSet(cuando) {
  const {rrule, rdate, exdate} = cuando
  const rruleset = new RRuleSet()
  //console.log(`rrule`, rrule)
  if (rrule) {
    const the_rule = getActualRRule(rrule)
    rruleset.rrule(the_rule)
  }

  if (rdate.length) {
    rdate.forEach(x => {
      return rruleset.rdate(x.toDate())
    })
  } 

  if (exdate.length) {
    exdate.forEach(x => {
      return rruleset.exdate(x.toDate())
    })
  }

  //console.log(`rruleset`, JSON.stringify(rruleset))
  return rruleset
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$.take(1).switchMap(props => {
    //const {rrule, rdates, exdates} = cuando
    const m = moment()//.add(1, 'day')
    const init = {
      cuando: props,
      month: m.month(),
      year: m.year()
    }

    return reducer$.startWith(Immutable.Map(init)).scan((acc, f: Function) => f(acc))
  })
  .map((x: any) => x.toJS())
  //.do(x => console.log(`calendar state`, x))
  .publishReplay(1).refCount()
}

function renderController(state) {
  const {year, month} = state
  return div(`.controller`, [
    div(`.appDecMonth.change-month-button.fa.fa-angle-left.fa-2x`, []),
    div(`.month-year-display`, [moment([year, month]).format('MMM YYYY')]),
    div(`.appIncMonth.change-month-button.fa.fa-angle-right.fa-2x`, [])
  ])
}

function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    })
    .map((info: any) => {
      const {state, components} = info
      return div(`.recurrence-calendar-container`, [
        div(`.recurrence-calendar`, [
          renderController(state),
          components.calendar
        ])
      ])
    })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const calendar = isolate(MonthCalendar)(sources, {
    ...inputs,
    props$: state$.map(state => {
      //console.log(`cuando to month calendar`, state.cuando)
      const {cuando, year, month} = state
      const rruleset = recurrenceToRRuleSet(cuando)

      // console.log({
      //   year, month
      // })
      const curr = moment([year, month])
      //console.log(`curr`, curr.toDate())
      //console.log(rruleset.between(curr.startOf('month').toDate(), curr.endOf('month').toDate()))

      const start = curr.clone().startOf('month').toDate()
      const end = curr.clone().endOf('month').toDate()
      //console.log(`start`, start)
      //console.log(`end`, end)
      const out = {
        month: month,
        year,
        rangeStart: undefined,
        rangeEnd: undefined,
        selected: rruleset.between(start, end, true).map(x => moment(x.toISOString()))
      }
      
      //console.log(`out`, out)
      return out
    })
  })
  const components = {
    calendar: calendar.DOM
  }

  const vtree$ = view(state$, components)


  return {
    DOM: vtree$,
    output$: calendar.output$
  }
}