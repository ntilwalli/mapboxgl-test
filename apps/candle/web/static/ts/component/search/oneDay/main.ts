import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeSink, spread, createProxy, componentify, mergeSinks, toMessageBusMainError} from '../../../utils'

import {drillInflate} from './helpers'
import deepEqual = require('deep-equal')
import moment = require('moment')

import intent from './intent'
import model from './model'
import view from './view'
import Grid from './grid/main'
import DoneModal from '../../../library/bootstrapDoneModal'
import Filters from './filters/main'
import DayChooser from '../../../library/bootstrapCalendarInput'
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
  const hide_modal$ = createProxy()
  const update_from_modal$ = createProxy()

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
      hide_modal$, 
      update_from_modal$,
      results$
    })

  const grid = Grid(sources, {
    props$: state$.map((x: any) => {
        return {results: x.results, filters: x.filters}
      })
      //.do(x => console.log(`to grid props$`, x))
      //.distinctUntilChanged(null, x => x),
  })

  const modal$ = state$
    .distinctUntilKeyChanged('modal')
    .map((state: any) => {
      if (state.modal === 'filters') {
        return DoneModal(sources, {
          ...inputs,
          props$: O.of({title: `Filters`}),
          initialState$: O.of(state.filters),
          content: Filters
        })
      } else if (state.modal === 'calendar') {
        return DoneModal(sources, {
          ...inputs,
          props$: O.of({title: `Choose date`}),
          initialState$: O.of(state.searchDateTime),
          content: DayChooser
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
  
  const modal = componentify(modal$)

  const navigator = Navigator(sources, {
    ...inputs,
    props$: state$.pluck('searchDateTime').distinctUntilChanged()
      //.do(x => console.log(`to grid props$`, x))
      //.distinctUntilChanged(null, x => x),
  })

  const show_filters$ = navigator.output$.filter((x :any) => {
    return x.type === 'showFilters'
  })
    .mapTo('filters')
  const show_calendar$ = navigator.output$.filter((x :any) => {
    return x.type === 'showCalendar'
  })
    .mapTo('calendar')

  const components = {
    navigator: navigator.DOM,
    grid$: grid.DOM,
    modal$: modal.DOM
  }
  const vtree$ = view(state$, components).publishReplay(1).refCount()

  // const request$ = state$
  //   .filter((state: any) => state.searchDateTime && state.searchPosition)
  //   .map((state: any) => ({
  //     searchDateTime: state.searchDateTime,
  //     searchPosition: state.searchPosition,
  //     filters: state.filters
  //   }))
  //   .distinctUntilChanged(deepEqual)
  //   .map((info: any) => {
  //     const {searchDateTime, searchPosition, filters} = info
  //     return {
  //       donde: {
  //         center: searchPosition.data,
  //         radius: 100000
  //       },
  //       cuando: {
  //         begins: searchDateTime.clone().startOf('day'),
  //         ends: searchDateTime.clone().endOf('day'),
  //       },
  //       releases: ['posted']
  //     }
  //   })

  const request$ = state$
    .filter((state: any) => state.searchDateTime && state.searchPosition)
    .map((state: any) => ({
      searchDateTime: state.searchDateTime,
      filters: state.filters
    }))
    .distinctUntilChanged(deepEqual)
    .map((info: any) => {
      const {searchDateTime, filters} = info
      return {
        donde: {
          center: filters.search_region.position,
          radius: 100000
        },
        cuando: {
          begins: searchDateTime.clone().startOf('day'),
          ends: searchDateTime.clone().endOf('day'),
        },
        releases: ['posted'],
        meta: {
          event_types: filters.event_types || [],
          categories: filters.categories || [],
        }
      }
    })

  const listing_info_query = ListingInfoQuery(sources, {props$: request$})

  waiting$.attach(listing_info_query.waiting$)
  results$.attach(
    listing_info_query.success$
      .map(results => results.map(drillInflate).filter(onlySingleStandard))
  )

  const merged = mergeSinks(navigator, grid, modal, listing_info_query)

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
              modal: undefined,
              searchDateTime: state.searchDateTime.clone().add(amt, 'days').toDate().toISOString(),
              filters: state.filters
            }
          }
        }),
      modal$.switchMap((x: any) => x.done$)
        .withLatestFrom(state$, (out, state: any) => {
          if (state.modal === 'filters') {
            return {
              pathname: '/',
              type: 'replace',
              state: {
                modal: undefined, 
                searchDateTime: state.searchDateTime,
                filters: out
              }
            }
          } else {
            return {
              pathname: '/',
              type: 'replace',
              state: {
                modal: undefined, 
                searchDateTime: out,
                filters: state.filters
              }
            }
          }
        }),
      modal$.switchMap((x: any) => x.close$)
        .withLatestFrom(state$, (out, state: any) => {
          return {
            pathname: '/',
            type: 'replace',
            state: {
              modal: undefined, 
              searchDateTime: state.searchDateTime,
              filters: state.filters
            }
          }
        }),
      O.merge(show_filters$, show_calendar$)
        .withLatestFrom(state$, (modal, state: any) => {
          return {
            pathname: '/',
            type: 'push',
            state: {
              modal,
              searchDateTime: state.searchDateTime,
              filters: state.filters
            }
          }
        })
    ),
    MessageBus: O.merge(
      merged.MessageBus,
      state$.pluck('filters')
        .distinctUntilChanged((x, y) => deepEqual(x, y))
        .map(filters => {
          return {
            to: '/services/searchFilters',
            message: filters
          }
        }),
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