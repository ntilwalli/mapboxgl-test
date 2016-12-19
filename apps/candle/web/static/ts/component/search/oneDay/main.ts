import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeSink, spread, createProxy} from '../../../utils'

import deepEqual = require('deep-equal')
import moment = require('moment')

import intent from './intent'
import model from './model'
import view from './view'
import Grid from './grid/main'
import DoneModal from '../../../library/doneModal'
import Filters from './filters'

const log = console.log.bind(console)
const shouldRefreshSearch = (x, y) => {
  //console.log(x, y)
  const x_dt = x.searchDateTime
  const y_dt = y.searchDateTime
  return x_dt.isSame(y_dt)
}

function main(sources, inputs) {
  const actions = intent(sources)
  const retrieve$ = createProxy()
  const hide_filters$ = createProxy()
  const update_filters$ = createProxy()

  const state$ = model(
    actions, {
      ...inputs, 
      props$: sources.Router.history$.map(x => x.state), 
      retrieve$, 
      hide_filters$, 
      update_filters$
    })
  const grid = Grid(sources, {
    props$: state$.map(x => {
        return {results: x.results, filters: x.filters}
      })
      //.do(x => console.log(`to grid props$`, x))
      //.distinctUntilChanged(null, x => x),
  })

  const filtersModal$ = state$.pluck(`showFilters`)
    .distinctUntilChanged()
    .map(val => {
      if (val) {
        return DoneModal(sources, {
          props$: O.of({title: `Filters`}),
          initialState$: state$.pluck(`filters`).take(1),
          content: Filters
        })
      } else {
        return {
          DOM: O.of(null),
          close$: O.never(),
          done$: O.never()
        }
      }
    })
    .publishReplay(1).refCount()


  hide_filters$.attach(filtersModal$.switchMap(x => x.close$))
  update_filters$.attach(filtersModal$.switchMap(x => x.done$))

  const components = {
    grid$: grid.DOM,
    filters$: filtersModal$.switchMap(x => x.DOM)
  }
  const vtree$ = view(state$, components).publishReplay(1).refCount()

  const toHTTP$ = state$
    .filter((state: any) => state.searchDateTime && state.searchPosition)
    .map((state: any) => ({
      searchDateTime: state.searchDateTime,
      searchPosition: state.searchPosition
    }))
    .distinctUntilChanged(deepEqual)
    .map((info: any) => {
      const {searchDateTime, searchPosition} = info
      return {
        url: "/api/user",
        method: "post",
        type: "json",
        send: {
          route: "/search",
          data: {
            begins: searchDateTime.clone().startOf('day'),
            ends: searchDateTime.clone().endOf('day'),
            center: searchPosition.data,
            radius: 100000
          }
        },
        category: `searchOneDay`
      }
    })
    //.do(x => console.log(`query: `, x))
    .publishReplay(1).refCount()

  retrieve$.attach(toHTTP$)

  return {
    DOM: vtree$,
    Router: O.merge(
      actions.change_date$.withLatestFrom(state$, (amt, state: any) => {
        //console.log(`Shifting date by: `, amt)
        return {
          pathname: `/`,
          type: 'replace',
          action: `REPLACE`,
          state: {
            searchDateTime: state.searchDateTime.clone().add(amt, 'days').toDate().toISOString()
          }
        }
      }),
      grid.Router,
      actions.show_user_profile$.withLatestFrom(state$, (_, state) => {
        const {authorization} = state
        return {
          pathname: `/home`,
          type: 'push',
          action: 'PUSH'
        }
      })
    ),
    HTTP: retrieve$,
    Storage: state$
      .filter((state: any) => state.searchDateTime && state.results && state.filters)
      .map((state: any) => ({
        results: state.results,
        searchDateTime: state.searchDateTime.toDate(),
        filters: state.filters
      }))
      .map(val => ({
        action: "setItem",
        key: "calendar/oneDay",
        value: JSON.stringify(val)
      })),
      //.do(x => console.log(`to storage`, JSON.parse(x.value))),
    MessageBus: O.merge(
      actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`}), 
      actions.show_login$.mapTo({to: `main`, message: `showLogin`})
    )

      //.filter(x => false)
      //.do(x => console.log(`to storage:`, x))
  }
}

export default main