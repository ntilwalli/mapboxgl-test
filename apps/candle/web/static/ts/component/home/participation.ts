import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a} from '@cycle/dom'
import {combineObj, processHTTP} from '../../utils'

import {main as CheckInGrid} from '../../library/checkInGrid'

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function drillInflate(result) {
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `getHomeProfile`)
  const check_ins$ = good$
    //.do(x => console.log(`got home/profile response`, x))
    .filter(onlySuccess)
    .pluck(`data`)
    .map(drillInflate)
    .publish().refCount()
  
  const error$ = good$
    .filter(onlyError)
    .pluck(`data`)
    .publish().refCount()

  return {
    check_ins$,
    error$,
  }
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

function render_profile_info(authorization, profile) {
  return div(`.info`, [
    div([authorization.name]),
    div([`(@${authorization.username})`])
  ])
}

function render_participation(info) {
  const {state, components} = info
  const {authorization, profile, selected_check_in} = state
  const {check_in_grid} = components



  return div(`.participation`, [
    span(`.heading`, [
      `Participation (Last 28 days)`
    ]),
    check_in_grid,
    selected_check_in ? render_selected_check_in_date(selected_check_in) : null
  ])
}

function reducers(actions, inputs) {
  const selected_check_in_r = inputs.selected_check_in$.map(x => state => {
    return state.set(`selected_check_in`, x)
  })

  const check_ins_r = actions.check_ins$.map(x => state => {
    return state.set('check_ins', x).set('waiting', false)
  })

  const waiting_r = inputs.to_http$.map(x => state => {
    return state.set('waiting', true)
  })

  return O.merge(selected_check_in_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.Authorization.status$
    .map(authorization => {
      return {
        authorization, 
        selected_check_in: undefined,
        check_ins: undefined,
        waiting: true
      }
    })
    .map(x => Immutable.Map(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`home/profile state`, x))
    .publishReplay(1).refCount()
}


export default function main(sources, inputs) {
  const actions = intent(sources)

  const check_in_grid = CheckInGrid(sources, inputs)

  return {
    DOM: O.of(div('.row', [
      div('.col-xs-12', [
        'Participation'
      ])
    ]))
  }
}