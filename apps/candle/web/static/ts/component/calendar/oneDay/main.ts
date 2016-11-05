import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeSink, spread, createProxy} from '../../../utils'

import deepEqual = require('deep-equal')
import moment = require('moment')

import intent from './intent'
import model from './model'
import view from './view'
import Grid from './grid/main'

const log = console.log.bind(console)

function main(sources, inputs) {
  const actions = intent(sources)
  const retrieve$ = createProxy()

  const state$ = model(actions, spread({retrieve$}, inputs))
  const grid = Grid(sources, {
    props$: state$
      .pluck(`results`).distinctUntilChanged(null, x => x)
  })

  const components = {
    grid$: grid.DOM
  }
  const vtree$ = view(state$, components).publishReplay(1).refCount()

  const toHTTP$ = state$
    .filter((state: any) => state.searchPosition && state.searchPosition)
    .map((state: any) => ({
      searchDateTime: state.searchDateTime,
      searchPosition: state.searchPosition
    }))
    .distinctUntilChanged(deepEqual, x => x)
    .map((info: any) => {
      const {searchDateTime, searchPosition} = info
      return {
        url: "/api/user",
        method: "post",
        type: "json",
        send: {
          route: "/search",
          data: {
            begins: searchDateTime.clone().add(3, 'day').startOf('day'),
            ends: searchDateTime.clone().add(3, 'day').endOf('day'),
            center: searchPosition.data,
            radius: 10000
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
    HTTP: retrieve$,
    Storage: state$.map((state: any) => ({
        results: state.results,
        searchDateTime: state.searchDateTime.toDate()
      }))
      .map(val => ({
        action: "setItem",
        key: "calendar/oneDay",
        value: JSON.stringify(val)
      }))
      //.filter(x => false)
      //.do(x => console.log(`to storage:`, x))
  }
}

export default main