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
  const hideFilters$ = createProxy()
  const updateFilters$ = createProxy()

  const state$ = model(actions, spread({retrieve$, hideFilters$, updateFilters$}, inputs))
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


  hideFilters$.attach(filtersModal$.switchMap(x => x.close$))
  updateFilters$.attach(filtersModal$.switchMap(x => x.done$))

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
      grid.Router,
      actions.showUserProfile$.withLatestFrom(state$, (_, state) => {
        const {authorization} = state
        return {
          pathname: `/home`,
          action: `PUSH`
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
    MessageBus: O.merge(
      actions.showMenu$.mapTo({to: `main`, message: `showLeftMenu`}), 
      actions.showLogin$.mapTo({to: `main`, message: `showLogin`})
    )

      //.filter(x => false)
      //.do(x => console.log(`to storage:`, x))
  }
}

export default main