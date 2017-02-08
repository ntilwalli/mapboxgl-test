import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a, h6, em, strong} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, mergeSinks, componentify, processHTTP} from '../../../utils'
import {inflateListing, inflateSession} from '../../helpers/listing/utils'

import ListingRow from '../../../library/listingRow'

function drillInflate(result) {
  result.listing = inflateListing(result.listing)
  result.children = result.children.map(x => inflateListing(x)).sort((x, y) => {
    return x.cuando.begins - y.cuando.begins
  })

  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {success$, error$} = processHTTP(sources, `getTreeListing`)
  const results$ = success$
    .map(x => {
      return x
    })
    .map(drillInflate)
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
  
  return combineObj({
    authorization$: inputs.Authorization.status$,
    props$: inputs.props$
  })
    .map((info: any) => {
      return {
        children: undefined,
        waiting: false,
        authorization: info.authorization,
        props: {
          ...info.props,
          children: info.props.children.sort((x, y) => {
            return y.cuando.begins - x.cuando.begins
          })
        }
      }
    })
    .map(x => Immutable.Map(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`home/profile state`, x))
    .publishReplay(1).refCount()
}


function renderSimpleRow(children) {
  return div('.row', [div('.col-12', children)])
}

function renderSimpleTextCenterRow(children) {
  return div('.row', [div('.col-12.text-xs-center', children)])
}

function view(state$, components) {
  return combineObj({
    state$,
    components: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    const {posted, sessions, staged, canceled} = components
    const {waiting} = state
    console.log('state', state)
    return waiting ? div('.loader') : div('.container.nav-fixed-offset.user-listings.mt-4', [

      div('.row.mb-4', [
        div('.col-12', [
          h6([strong(['Recurrences'])]),
          posted
        ])
      ])
    ])
  })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const waiting$ = createProxy()
  const state$ = model(actions, {...inputs, waiting$})

  const posted$ = state$
    .map((state: any) => {
      const {props} = state
      if (props && props.children && props.children.length) {
        const items = props.children.map(x => isolate(ListingRow)(sources, {...inputs, props$: O.of({listing: x, children: []})}))
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
          div('.col-12', x)
        ])
      } else {
        return undefined
      }
    })
  }

  const components = {
    posted: posted_w_row.DOM
  }

  // const to_http$ = O.of(undefined).withLatestFrom(inputs.Authorization.status$, (_, user: any) => {
  //     return {
  //         url: `/api/user`,
  //         method: `post`,
  //         send: {
  //           route: '/listings/children'
  //         },
  //         category: 'getListingChildren'
  //     }
  //   })
  //   .delay(0)
  //   .do(x => console.log(`retrieve listing toHTTP`, x))
  //   .publishReplay(1).refCount()



  //waiting$.attach(to_http$)

  const merged = mergeSinks(posted_w_row)

  return {
    ...merged,
    DOM: view(state$, components),
    HTTP: O.merge(
      merged.HTTP//, to_http$
    )
  }
}