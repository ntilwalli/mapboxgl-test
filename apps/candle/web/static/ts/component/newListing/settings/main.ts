import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong, pre, ul, li} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP, PositionToRegion} from '../../../utils'
import {inflateListing, inflateSession, listingToSession} from '../../helpers/listing/utils'

import Menu from './menu'
import Basics from '../../create/newListing/basics/outputMain'

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
  const save$ = DOM.select('.appSaveButton').events('click')
  return {
    save$
  }
}

function muxHTTP(sources) {
  return processHTTP(sources, 'updateListing')
}

function renderButtons(state) {
  return div([
    button('.appSaveButton.mt-4.btn.btn-outline-success.d-flex.cursor-pointer.mt-4', [
      span('.d-flex.align-items-center', ['Save changes']),
      span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
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
      return div('listing-settings', [
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
        div('.container', {style: {"margin-top": "5rem"}}, [
          content
        ]),
        renderButtons(state)
      ])
    })
}

function reducers(actions, inputs) {
  const updated_result_r = inputs.updated_result$.map(result => state => {
    return state.set('session', Immutable.fromJS(result.session)).set('updated', true).set('valid', result.valid)
  })

  const save_status_r = inputs.save_status$.map(status => state => {
    return state.set('save_status', status)
  })

  return O.merge(updated_result_r, save_status_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    session$: inputs.session$,
  }).take(1)
    .switchMap((info: any) => {
      const {session} = info
      return reducer$.startWith(Immutable.fromJS({session, valid: true, updated: false, save_status: undefined}))
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
  const muxed_http = muxHTTP(sources)
  const content$ = navigator.output$
    .map((page: any) => {
      if (page === 'basics') {
        return Basics(sources, {
          ...inputs, 
          show_errors$: actions.save$.mapTo(true).startWith(false), 
          save_status$: muxed_http.good$,
          
        })
      } else {
        return NotImplemented(sources, inputs)
      }
    }).publishReplay(1).refCount()

  const content: any = componentify(content$)
  const state$ = model({}, {...inputs, save_status$: muxed_http.good$, updated_result$: content$.switchMap((x: any) => x.output$)})

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

  const to_http$ = actions.save$
        .withLatestFrom(state$, (_, state: any) => {
          return state
        })
        .filter((state: any) => state.updated && state.valid)
        .map((state: any) => {
          return {
            url: `/api/user`,
            method: `post`,
            category: 'updateListing',
            send: {
              route: `/listing_session/save`,
              data: state.session.listing
            }
          }
        })

  const merged = mergeSinks(navigator, content)
  return {
    ...merged,
    DOM: view(state$, components, inputs.menu_active$),
    HTTP: to_http$,
    Router: O.merge(
      merged.Router,
      navigator.next$
        .withLatestFrom(inputs.session$, (page, session: any) => {
          return {
            pathname: sources.Router.createHref('/' + page),
            state: session,
            type: 'push'
          }
        })
    )
    .map(x => {
      return x
    })
  }
}