import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import intent from './intent'
import model from './model'
import view from './view'

import Immutable = require('immutable')

import {combineObj, normalizeComponent, mergeSinks, spread} from '../../../utils'

import Heading from '../../../library/heading/standard/main'

function main(sources, inputs) {
  const heading = normalizeComponent(Heading(sources, inputs))
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const components = {
    heading$: heading.DOM
  }
  const vtree$ = view(state$, components)

  const toLocationWithListing$ = actions.continue$
    .switchMap(() => {
      return state$.filter(state => !!state.listing).map(state => state.listing)
    })
    .map(listing => {
      if (listing.id) {
        return {
          action: `PUSH`, pathname: `/create/${listing.id}/meta`, state: listing
        }
      } else {
        return {
          action: `PUSH`, pathname: `/create/meta`, state: listing
        }
      }
    })

  const toLocationWithoutListing$ = actions.continue$
    .switchMap(() => {
      return state$.filter(state => !state.listing)
    })
    .map(() => {
      return {
        action: `PUSH`, pathname: `/create/meta`
      }
    })

  const localMergeable = {
    Router: O.merge(
      toLocationWithListing$, 
      toLocationWithoutListing$
    )
  }

  return spread(mergeSinks(heading, localMergeable), {
    DOM: vtree$
  })
}

export default (sources, inputs) => main(sources, inputs)
