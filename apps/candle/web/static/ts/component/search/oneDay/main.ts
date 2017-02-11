import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeSink, spread, createProxy, componentify, mergeSinks, toMessageBusMainError} from '../../../utils'
import {inflateListing} from '../../helpers/listing/utils'
import deepEqual = require('deep-equal')
import moment = require('moment')

import intent from './intent'
import model from './model'
import view from './view'
import Grid from './grid/main'
import DoneModal from '../../../library/doneModal'
import Filters from './filters'
import Navigator from '../../../library/navigators/search'

import ListingInfoQuery from '../../../query/listingInfoQuery'

const log = console.log.bind(console)

const onlySingleStandard = x => {
  //console.log(x)
  const listing = x.listing
  //if (listing.type === "single" && listing.meta.type === "standard" && listing.cuando.begins) {
  if (listing.type === "single" && listing.cuando.begins) {
    return true
  } else {
    return false
  }
}

function drillInflate(result) {
  result.listing = inflateListing(result.listing)
  return result
}


const shouldRefreshSearch = (x, y) => {
  //console.log(x, y)
  const x_dt = x.searchDateTime
  const y_dt = y.searchDateTime
  return x_dt.isSame(y_dt)
}

function main(sources, inputs) {
  const actions = intent(sources)
  const waiting$ = createProxy()
  const results$ = createProxy()
  const hide_filters$ = createProxy()
  const update_filters$ = createProxy()
  const show_filters$ = createProxy()

  const router_state$ = sources.Router.history$
    .map(x => {
      //if (x.state && x.state.searchDateTime) x.state.searchDateTime = moment(x.state.searchDateTime)
      return x.state
    }).publishReplay(1).refCount()

  const state$ = model(
    actions, {
      ...inputs, 
      props$: router_state$, 
      waiting$, 
      hide_filters$, 
      update_filters$,
      show_filters$,
      results$
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
  
  const filters_modal = componentify(filtersModal$)


  hide_filters$.attach(filtersModal$.switchMap(x => x.close$))
  update_filters$.attach(filtersModal$.switchMap(x => x.done$))

  const navigator = Navigator(sources, {
    ...inputs,
    props$: state$.pluck('searchDateTime').distinctUntilChanged()
      //.do(x => console.log(`to grid props$`, x))
      //.distinctUntilChanged(null, x => x),
  })

  show_filters$.attach(navigator.output$.filter((x :any) => x.type === 'showFilters'))


  const components = {
    navigator: navigator.DOM,
    grid$: grid.DOM,
    filters$: filtersModal$.switchMap(x => x.DOM)
  }
  const vtree$ = view(state$, components).publishReplay(1).refCount()

  const request$ = state$
    .filter((state: any) => state.searchDateTime && state.searchPosition)
    .map((state: any) => ({
      searchDateTime: state.searchDateTime,
      searchPosition: state.searchPosition
    }))
    .distinctUntilChanged(deepEqual)
    .map((info: any) => {
      const {searchDateTime, searchPosition} = info
      return {
        donde: {
          center: searchPosition.data,
          radius: 100000
        },
        cuando: {
          begins: searchDateTime.clone().startOf('day'),
          ends: searchDateTime.clone().endOf('day'),
        },
        releases: ['posted']
      }
    })

  const listing_info_query = ListingInfoQuery(sources, {props$: request$})

  waiting$.attach(listing_info_query.waiting$)
  results$.attach(
    listing_info_query.success$
      .map(results => results.map(drillInflate).filter(onlySingleStandard))
  )

  const merged = mergeSinks(navigator, grid, filters_modal, listing_info_query)

  return {
    ...merged,
    DOM: vtree$,
    Router: O.merge(
      merged.Router,
      navigator.output$
        .filter((x: any) => x.type === 'changeDay')
        .map((x: any) => x.data)
        .withLatestFrom(state$, (amt, state: any) => {
          //console.log(`Shifting date by: `, amt)
          return {
            pathname: `/`,
            type: 'replace',
            action: `REPLACE`,
            state: {
              searchDateTime: state.searchDateTime.clone().add(amt, 'days').toDate().toISOString()
            }
          }
        })
    ),
    MessageBus: O.merge(
      merged.MessageBus,
      listing_info_query.error$.map(toMessageBusMainError)
    ),
    Storage: O.never()
    // state$
    //   .filter((state: any) => state.searchDateTime && state.results && state.filters)
    //   .map((state: any) => ({
    //     results: state.results,
    //     searchDateTime: state.searchDateTime.toDate(),
    //     filters: state.filters
    //   }))
    //   .map(val => ({
    //     action: "setItem",
    //     key: "calendar/oneDay",
    //     value: JSON.stringify(val)
    //   })),
      //.filter(x => false)
      //.do(x => console.log(`to storage:`, x))
  }
}

export default main