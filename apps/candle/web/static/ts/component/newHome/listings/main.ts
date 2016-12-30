import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP} from '../../../utils'
import {inflateListing} from '../../helpers/listing/utils'

import ListingRow from '../listingRow'

function drillInflate(result) {
  result.listing = inflateListing(result.listing)
  result.children.map(inflateListing)
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {success$, error$} = processHTTP(sources, `getTreeListing`)
  const listings$ = success$
    .map(drillInflate)
    .map(x => [x])
    .publish().refCount()

  return {
    listings$,
    not_found$: error$,
  }
}

function reducers(actions, inputs) {
  const listings_r = actions.listings$.map(listings => state =>  {
    return state.set('listings', listings).set('waiting', false)
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
        listings: undefined,
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


function renderSimpleRow(item) {
  return div('.row', [div('.col-xs-12', [item])])
}

function renderSimpleTextCenterRow(item) {
  return div('.row', [div('.col-xs-12.text-xs-center', [item])])
}

function view(state$, components) {
  return combineObj({
    state$,
    components: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    const {trees} = components
    const {waiting} = state
    console.log('state', state)
    return waiting ? div('.loader') : div('.container.nav-fixed-offset.user-listings.mt-1', [
      div('.row', [
        div('.col-xs-12', [
          trees ? trees : renderSimpleRow(['No current listings'])
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

  const trees$ = state$.pluck('listings')
    .map(listings => {
      if (listings && listings.length) {
        const items = listings.map(x => isolate(ListingRow)(sources, {...inputs, props$: O.of(x)}))
        const merged = mergeSinks(...items)
        return {
          ...merged,
          DOM: O.combineLatest(...items.map(x => x.DOM))
            .do(x => {
              console.log('listing trees: ', x)
            })
        }
      } else {
        return {
          DOM: O.of(undefined)
        }
      }
    }).publishReplay(1).refCount()

  const trees_component = componentify(trees$)
  const trees = {
    ...trees_component,
    DOM: trees_component.DOM.map(x => {
      if (x) {
        return div('.trees.row', [div('.col-xs-12', x)])
      } else {
        return undefined
      }
    })
  }

  const components = {
    trees: trees.DOM
  }

  const to_http$ = O.of(undefined)
    .map(x => {
      return {
          url: `/api/user`,
          method: `post`,
          send: {
            route: "/retrieve_listing",
            data: 1
          },
          category: `getTreeListing`
      }
    })
    .delay(0)
    .do(x => console.log(`retrieve listing toHTTP`, x))
    .publishReplay(1).refCount()

  waiting$.attach(to_http$)

  return {
    ...trees,
    DOM: view(state$, components),
    HTTP: to_http$
  }
}