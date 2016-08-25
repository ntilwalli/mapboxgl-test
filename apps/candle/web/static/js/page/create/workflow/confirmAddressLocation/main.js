import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import view from './view'
import mapView from './mapView'
import intent from './intent'
import model from './model'
import Immutable from 'immutable'

import {div, li, span} from '@cycle/DOM'
import combineObj from '../../../combineObj'

import {noopListener, normalizeSink, normalizeSinkUndefined} from '../../../utils'

export default function main(sources, inputs) {

  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)
  const mapvtree$ = mapView(state$)

  const toNextScreen$ = actions.next$
    .map(() => state$
      .map(state => state.listing)
      .map(listing => {
        return {
          pathname: `/create/${listing.id}/time`,
          action: `PUSH`,
          state: listing
        }
      })
    ).flatten()

  const toPreviousScreen$ = actions.back$
    .map(() => state$.map(state => {
        return {
          pathname: `/create/${state.listing.id}/location`,
          action: `PUSH`,
          state: state.listing
        }

    }))
    .flatten()
    .debug(`confirmAddressLocation back$`)

  return {
    DOM: vtree$,
    HTTP: xs.never(),
    Router: xs.merge(toNextScreen$, toPreviousScreen$),
    Global: xs.never(),
    Storage: xs.never(),
    MapDOM: mapvtree$,
    message$: state$
      .drop(1)
      .map(state => state.listing)
      .map(listing => ({
        type: `listing`,
        data: listing
      }))
  }
  // 
  // return {
  //   DOM: xs.of(div([`Hello`])),//vtree$,
  //   HTTP: xs.never(),
  //   Router: xs.never(), //xs.merge(toNextScreen$, toPreviousScreen$),
  //   Global: xs.never(),
  //   Storage: xs.never(),
  //   MapDOM: xs.never(),//$,
  //   message$: xs.never()
  // }

}
