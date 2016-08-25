import xs from 'xstream'
import isolate from '@cycle/isolate'
import intent from './intent'
import model from './model'
import view from './view'

import Immutable from 'immutable'

import {div} from '@cycle/DOM'
import combineObj from '../../../combineObj'

import {noopListener} from '../../../utils'

function main(sources, inputs) {
  const actions = intent(sources)

  // const toHTTP$ = xs.never()
  const toHTTPMimic$ = xs.create()
  //.remember()

  const state$ = model(actions, {...inputs, toHTTP$: toHTTPMimic$})
  const vtree$ = view(state$)

  const toLocationWithListing$ = actions.continue$
    .map(() => state$.filter(state => !!state.listing).map(state => state.listing))
    .flatten()
    .map(listing => {
      if (listing.id) {
        return {
          action: `PUSH`, pathname: `/create/${listing.id}/listingType`, state: listing
        }
      } else {
        return {
          action: `PUSH`, pathname: `/create/listingType`, state: listing
        }
      }
    })
    //.debug()

  const toLocationWithoutListing$ = actions.continue$
    .map(() => state$.filter(state => !state.listing))
    .flatten()
    .map(() => {
      return {
        action: `PUSH`, pathname: `/create/listingType`
      }
    })

  return {
    DOM: vtree$,
    HTTP: xs.never(),
    Router: xs.merge(toLocationWithListing$, toLocationWithoutListing$)
      .debug(`landing toRouter...`),
    Global: xs.never(),
    Storage: xs.never(),
    message$: xs.never()
  }
}

export default (sources, inputs) => main(sources, inputs)
