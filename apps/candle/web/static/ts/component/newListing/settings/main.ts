import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong, pre, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP, PositionToRegion} from '../../../utils'
import {inflateListing, inflateSession, listingToSession, isExpired, clearAdminMessage} from '../../helpers/listing/utils'

import Menu from './menu'
import Basics from '../../create/newListing/basics/updateMain'
import Advanced from '../../create/newListing/advanced/updateMain'
import Admin from './admin'

function NotImplemented(sources, inputs) {
  return {
    DOM: O.of(div('.not-implemented.container', ['Not implemented'])),
    output$: O.never()
  }
}

const routes = [
  {pattern: /^\/basics$/, value: {type: 'success', data: 'basics'}},
  {pattern: /^\/advanced$/, value: {type: 'success', data: 'advanced'}},
  {pattern: /^\/admin$/, value: {type: 'success', data: 'admin'}},
  {pattern: /.*/, value: {type: "error"}}
]

function drillInflate(result) {
  // console.log(result)
  result.listing = inflateListing(result.listing)
  result.children.map(inflateListing)
  return result
}


function intent(sources) {
  const {DOM} = sources
  return {
  }
}

function renderButtons(state) {
  const is_expired = isExpired(state.session)
  return div([
    button('.appSaveButton.mt-4.btn.btn-outline-success.d-flex.cursor-pointer.mt-4', {class: {"read-only": is_expired}}, [
      span('.d-flex.align-items-center', ['Save changes']),
      //span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
    ])
  ])
}

function view(state$, components, menu_active$) {
  return combineObj({
      state$, 
      components$: combineObj(components),
      menu_active$
    })
    .debounceTime(0)
    .map((info: any) => {
        const {state, components, menu_active} = info
      const {navigator, content} = components
      return div('.listing-settings', [
        div({
          style: {
            "border-width": "1px 0", 
            "border-style": "solid", 
            "border-color": "black", 
            "background-color": "#F7F7F7", 
            position: "fixed", 
            width: "100%", 
            height: "2rem", 
            top: menu_active ? "9rem" : "3rem", 
            "flex-flow": "1 1 auto",
            "margin-bottom": 0,
            "z-index": 1000
          }
        }, [
          navigator
        ]),
        div('.container.mb-4', {style: {"margin-top": "5rem"}}, [
          content
        ]),
      ])
    })
}

function reducers(actions, inputs) {
  const updated_result_r = inputs.updated_result$.map(result => state => {
    return state.setIn(['listing_result', 'session'], Immutable.fromJS(result.session)).set('updated', true).set('valid', result.valid)
  })

  return O.merge(updated_result_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    listing_result$: inputs.listing_result$,
  }).take(1)
    .switchMap((info: any) => {
      const {listing_result} = info
      return reducer$.startWith(Immutable.fromJS({listing_result, valid: true, updated: false, save_status: undefined}))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .do(x => {
      console.log('listing/settings/main', x)
    })
    .publishReplay(1).refCount()
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const navigator = isolate(Menu)(sources, inputs)
  const content$ = navigator.output$
    .map((page: any) => {
      const new_sources = {...sources, Router: sources.Router.path(page)}
      const session$ = inputs.listing_result$.pluck('session').publishReplay(1).refCount()
      if (page === 'basics') {
        return Basics(new_sources, {...inputs, session$})
      } else if (page === 'advanced') {
        return Advanced(new_sources, {...inputs, session$})
      } else if (page === 'admin') {
        return Admin(new_sources, {...inputs, session$})
      } else {
        return NotImplemented(new_sources, {...inputs, session$})
      }
    }).publishReplay(1).refCount()

  const content: any = componentify(content$)
  const state$ = model({}, {...inputs, updated_result$: content$.switchMap((x: any) => x.output$)})

  const components = {
    navigator: navigator.DOM
      .map(x => {
        return x
      }),
    content: content.DOM
      .map(x => {
        return x
      })
  }

  const merged = mergeSinks(navigator, content)
  return {
    ...merged,
    DOM: view(state$, components, inputs.menu_active$),
    Router: O.merge(
      merged.Router,
      navigator.next$
        .withLatestFrom(inputs.listing_result$, (page, listing_result: any) => {
          clearAdminMessage(listing_result.session)

          return {
            pathname: sources.Router.createHref('/' + page),
            state: listing_result,
            type: 'push'
          }
        })
    )
    .map(x => {
      return x
    })
  }
}