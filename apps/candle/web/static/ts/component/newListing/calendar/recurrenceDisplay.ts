import {Observable as O} from 'rxjs'
import {div, ul, li} from '@cycle/dom'
import Immutable = require('immutable')
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks} from '../../../utils'
import ListingQuery from '../../../query/listingQuery'
import {ListingQueryRequest} from '../../../interfaces'
import {RecurrenceDisplayFilterOptions} from '../../../listingTypes'
import {recurrenceDisplayFilterOptionToRange} from '../../helpers/listing/utils'
import ComboBox from '../../../library/comboBox'

function intent(sources) {
  const {DOM} = sources

  const listing$ = DOM.select('.appRecurrenceListing').events('click')
    .map(ev => ev.ownerTarget.listing)

  return {
    listing$
  }
}

function model(actions, inputs) {
  return inputs.props$
    .publishReplay(1).refCount()
}

function renderListing(listing) {
  const {meta, cuando, donde, release} = listing
  return li('.appRecurrenceListing.listing', {props: {listing}}, [
    div([
      meta.name
    ]),
    div([
      release
    ])
  ])
}

function view(state$) {
  return state$.map(state => {
    return ul('.list-unstyled.recurrence-display', state.map(renderListing))
  })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)
  const to_router$ = actions.listing$
    .map(listing => {
      return {
        pathname: '/listing/' + listing.id,
        type: 'push'
      }
    })

  return {
    DOM: vtree$,
    Router: to_router$
  }
}