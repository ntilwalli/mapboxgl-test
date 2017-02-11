import {Observable as O} from 'rxjs'
import {div, h6, ul, li} from '@cycle/dom'
import Immutable = require('immutable')
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks} from '../../../utils'
import ListingQuery from '../../../query/listingQuery'
import {ListingQueryRequest} from '../../../interfaces'
import {RecurrenceDisplayFilterOptions} from '../../../listingTypes'
import {recurrenceDisplayFilterOptionToRange} from '../../helpers/listing/utils'
import ComboBox from '../../../library/comboBox'
import {renderStatus} from '../../helpers/listing/renderBootstrap'

import moment = require('moment')

function notStaged(x) {
  return x.release !== 'staged'
}

function sortDates(x, y) {
  return x.cuando.begins - y.cuando.begins
}

function intent(sources) {
  const {DOM} = sources

  const listing$ = DOM.select('.appRecurrenceListing').events('click')
    .map(ev => ev.ownerTarget.listing)

  return {
    listing$
  }
}

function model(actions, inputs) {
  return combineObj({
      props$: inputs.props$,
      authorization$: inputs.Authorization.status$
    })
    .publishReplay(1).refCount()
}

function renderListing(listing) {
  const {meta, cuando, donde, release} = listing
  return li('.appRecurrenceListing.listing.d-flex.justify-content-between.list-group-item.hover-gray', {props: {listing}}, [
    div('.d-flex.flex-column', [
      h6([meta.name]),
      div({class: {red: cuando.begins.isSameOrBefore(moment())}}, [cuando.begins.format('LLLL')])
    ]),
    div([
      renderStatus(listing)
    ])
  ])
}

function view(state$) {
  return state$.map(state => {
    const {props, authorization} = state
    const listings = props.sort(sortDates)
    const children = listings.length ? listings.map(renderListing) : [div(['No recurrences available'])]
    return ul('.recurrence-display.list-group.w-100', children)
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