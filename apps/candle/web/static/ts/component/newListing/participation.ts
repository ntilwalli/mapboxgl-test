import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h5, h6} from '@cycle/dom'
import {combineObj, createProxy, processHTTP} from '../../utils'
import moment = require('moment')
import deepEqual = require('deep-equal')

import {main as CheckInGrid} from '../../library/checkInGrid'
import {main as FullYearCheckInGrid} from '../../library/fullYearCheckinGrid'


function inflateCheckIn(result) {
  result.check_in_datetime = moment(result.check_in_datetime)
  result.listing_datetime = moment(result.listing_datetime)
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {success$, error$} = processHTTP(sources, `homeCheckIns`)
  const check_ins$ = success$
    .pluck(`check_ins`)
    .map(x => x.map(inflateCheckIn))
    .publish().refCount()

  return {
    check_ins$,
    error$,
  }
}

function reducers(actions, inputs) {
  const selected_check_in_r = inputs.selected_check_in$.map(x => state => {
    return state.set(`selected_check_in`, x)
  })

  const check_ins_r = actions.check_ins$.map(x => state => {
    return state.set('check_ins', x)
  })

  return O.merge(check_ins_r, selected_check_in_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return O.of(undefined)
    .map(_ => {
      return { 
        selected_check_in: undefined,
        check_ins: []
      }
    })
    .map(x => Immutable.Map(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`home/profile state`, x))
    .publishReplay(1).refCount()
}

function render_check_in(info) {
  return div(`.check-in`, [
    span([info.listing_name]),
    ', ',
    span([info.check_in_datetime.format('LT')])
  ])
}

function renderBreakdown(info) {
  let out

  if (info.length) {
    out = info.map(render_check_in)
  } else {
    out = [`No check-ins on this day`]
  }

  return div(`.check-ins-breakdown`, out)
}

function render_selected_check_in_date(info) {
  const date = info.date
  return div(`.selected-date-section`, [
    div(`.heading`, [date.format('LL')]),
    renderBreakdown(info.check_ins)
  ])
}

function render_participation(info) {
  const {state, components} = info
  const {authorization, check_ins, selected_check_in} = state
  const {check_in_grid} = components
  const num_string = check_ins && check_ins.length ? check_ins.length.toString() : 'No'
  return div(`.row`, [
    div('.col-xs-12', [
      div ('.row.hidden-sm-down', [
        div('.col-xs-12', [
          h6([
            num_string + ' check-ins in the last year'
          ]),
          check_in_grid,
          selected_check_in ? render_selected_check_in_date(selected_check_in) : null
        ])
      ]),
      div('.row.mt-1', [
        div('.col-xs-12', [
          h6(['Check-in activity']),
          div('.row', [
            div('.col-xs-12', check_ins.length ? check_ins.map(x => div(['Check in'])) : ['No activity'])
          ])
        ])
      ]),
    ])
  ])
}


function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    }).map((info: any) => {
      return render_participation(info)
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const selected_check_in$ = createProxy()
  const state$ = model(actions, {...inputs, selected_check_in$})

  // const check_in_grid = CheckInGrid(sources, {
  //   ...inputs, 
  //   props$: state$.pluck('check_ins')
  //     .filter(x => !!x)
  //     .do(x => {
  //       console.log('Hey check ins!')
  //     })
  //     .distinctUntilChanged(deepEqual)

  // })

  const check_in_grid = FullYearCheckInGrid(sources, {
    ...inputs, 
    props$: state$.pluck('check_ins')
      .filter(x => !!x)
      .do(x => {
        console.log('Hey check ins!')
      })
      .distinctUntilChanged(deepEqual)

  })

  selected_check_in$.attach(check_in_grid.output$)

  const to_http$ = O.of({
    url: `/api/user`,
    method: `post`,
    category: `homeCheckIns`,
    send: {
      route: `/home/check_ins`,
      data: {
        begins: moment().startOf('week').subtract(52*7, 'day'),
        ends: moment().endOf('day')
      }
    }
  })

  return {
    ...check_in_grid,
    DOM: view(state$, {check_in_grid: check_in_grid.DOM}),
    HTTP: to_http$
  }
}