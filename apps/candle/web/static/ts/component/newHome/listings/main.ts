import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP} from '../../../utils'
import {inflateListing, inflateSession} from '../../helpers/listing/utils'

import ListingRow from './listingRow'
import SessionRow from './sessionRow'

function drillInflate(result) {
  result.sessions = result.sessions.map(inflateSession)
  result.staged = result.staged.map(inflateListing)
  result.posted = result.posted.map(inflateListing)
  return result
}
function hasParent(l) { return !!l.parent_id}
function addChild(l, children_map) {
  const pid = l.parent_id
  if (children_map[pid]) {
    children_map[pid].push(l)
  } else {
    children_map[pid] = [l]
  }
}
function withChildren(l, children_map) {
  return {
    listing: l,
    children: children_map[l.id] 
  }
}
function toHierarchy(listings) {
  const children_map = {}
  listings.filter(l => hasParent(l)).forEach(l => addChild(l, children_map))
  const no_parent_listings = listings.filter(l => !hasParent(l)).map(withChildren)
  return no_parent_listings
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {success$, error$} = processHTTP(sources, `getTreeListing`)
  const results$ = success$
    .map(x => {
      return x
    })
    .map(drillInflate)
    .map(resp => {
      return {
        ...resp,
        staged: toHierarchy(resp.staged),
        posted: toHierarchy(resp.posted)
      }
    })
    .publish().refCount()

  return {
    results$,
    not_found$: error$,
  }
}

function reducers(actions, inputs) {
  const listings_r = actions.results$.map(results => state =>  {
    return state.set('results', results).set('waiting', false)
  })

  const waiting_r = inputs.waiting$.map(_ => state => {
    return state.set('waiting', true)
  })

  return O.merge(listings_r, waiting_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.Authorization.status$
    .map(authorization => {
      return {
        results: undefined,
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


function renderSimpleRow(children) {
  return div('.row', [div('.col-xs-12', children)])
}

function renderSimpleTextCenterRow(children) {
  return div('.row', [div('.col-xs-12.text-xs-center', children)])
}

function view(state$, components) {
  return combineObj({
    state$,
    components: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    const {posted, sessions, staged} = components
    const {waiting} = state
    console.log('state', state)
    return waiting ? div('.loader') : div('.container.nav-fixed-offset.user-listings.mt-1', [
      div('.row.mb-1', [
        div('.col-xs-12', [
          h6([strong(['Posted'])]),
          posted ? posted : renderSimpleRow(['No posted listings'])
        ])
      ]),
      div('.row.mb-1', [
        div('.col-xs-12', [
          h6([strong(['Staged'])]),
          staged ? staged : renderSimpleRow(['No staged listings'])
        ])
      ]),
      div('.row', [
        div('.col-xs-12', [
          h6([strong(['In progress'])]),
          sessions ? sessions : renderSimpleRow(['No listings in progress'])
        ])
      ])
    ])
  })
}

export default function main(sources, inputs) {

  // const trees = [
  //   TreeNode(sources, {...inputs, props$: O.of()})
  // ]
  const actions = intent(sources)
  const waiting$ = createProxy()
  const state$ = model(actions, {...inputs, waiting$})

  const sessions$ = state$
    .map(state => {
      const {results} = state
      if (results && results.sessions && results.sessions.length) {
        const items = results.sessions.map(x => isolate(SessionRow)(sources, {...inputs, props$: O.of(x)}))
        const merged = mergeSinks(...items)
        const errors$ = O.merge(items.map(x => x.errors$))
        const m_http$ = merged.HTTP.publish().refCount()
        return {
          ...merged,
          HTTP: m_http$,
          DOM: O.combineLatest(...items.map(x => x.DOM)),
          errors$
        }
      } else {
        return {
          DOM: O.of(undefined),
          errors$: O.never()
        }
      }
    }).publishReplay(1).refCount()

  const sessions = componentify(sessions$)
  const sessions_w_row = {
    ...sessions,
    DOM: sessions.DOM.map(x => {
      if (x) {
        return div('.trees.row', [
          div('.col-xs-12', x)
        ])
      } else {
        return undefined
      }
    })
  }

  const posted$ = state$
    .map(state => {
      const {results} = state
      if (results && results.posted && results.posted.length) {
        const items = results.posted.map(x => isolate(ListingRow)(sources, {...inputs, props$: O.of(x)}))
        const merged = mergeSinks(...items)
        return {
          ...merged,
          DOM: O.combineLatest(...items.map(x => x.DOM))
        }
      } else {
        return {
          DOM: O.of(undefined)
        }
      }
    }).publishReplay(1).refCount()

  const posted = componentify(posted$)
  const posted_w_row = {
    ...posted,
    DOM: posted.DOM.map(x => {
      if (x) {
        return div('.trees.row', [
          div('.col-xs-12', x)
        ])
      } else {
        return undefined
      }
    })
  }

  const staged$ = state$
    .map(state => {
      const {results} = state
      if (results && results.staged && results.staged.length) {
        const items = results.staged.map(x => isolate(ListingRow)(sources, {...inputs, props$: O.of(x)}))
        const merged = mergeSinks(...items)
        return {
          ...merged,
          DOM: O.combineLatest(...items.map(x => x.DOM))
        }
      } else {
        return {
          DOM: O.of(undefined)
        }
      }
    }).publishReplay(1).refCount()

  const staged = componentify(staged$)
  const staged_w_row = {
    ...staged,
    DOM: staged.DOM.map(x => {
      if (x) {
        return div('.trees.row', [
          div('.col-xs-12', x)
        ])
      } else {
        return undefined
      }
    })
  }



  const components = {
    sessions: sessions_w_row.DOM,
    posted: posted_w_row.DOM,
    staged: staged_w_row.DOM
  }

  // const to_http$ = O.of(undefined)
  //   .map(x => {
  //     return {
  //         url: `/api/user`,
  //         method: `post`,
  //         send: {
  //           route: "/retrieve_listing",
  //           data: 1
  //         },
  //         category: `getTreeListing`
  //     }
  //   })
  //   .delay(0)
  //   .do(x => console.log(`retrieve listing toHTTP`, x))
  //   .publishReplay(1).refCount()

  const to_http$ = O.of(undefined)
    .map(x => {
      return {
          url: `/api/user`,
          method: `post`,
          send: {
            route: "/home/listings"
          },
          category: `getTreeListing`
      }
    })
    .delay(0)
    .do(x => console.log(`retrieve listing toHTTP`, x))
    .publishReplay(1).refCount()



  waiting$.attach(to_http$)

  const merged = mergeSinks(posted_w_row, sessions_w_row)

  return {
    ...merged,
    DOM: view(state$, components),
    HTTP: O.merge(
      merged.HTTP, to_http$
    )
  }
}