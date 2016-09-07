import xs from 'xstream'
//import dropRepeats from 'xstream/extra/dropRepeats'
import view from './view'
import intent from './intent'
import model from './model'
import VirtualDOM from 'virtual-dom'

import {div} from '@cycle/DOM'
import combineObj from '../../../combineObj'

import {noopListener} from '../../../utils'

import DateInput from '../../../general/dateInput/main'

export default function main(sources, inputs) {

  const actions = intent(sources)

  const setWaiting$ = xs.create()

  const state$ = model(actions, {...inputs, setWaiting$})  // drop 1 because radioInput emits based on props which is already used initially to set up the local state

  const startDate = DateInput(sources, {
    props$: xs.of({
      defaultNow: false
    }),
    rangeStart$: xs.never(),
    rangeEnd$: xs.never()
  })

  const components = {
    startDate$: startDate.DOM
  }
  const vtree$ = view(state$, components).debug(`from name vtree$`)



  const toNextScreen$ = actions.next$
    .map(() => xs.merge(
      state$.filter(state => !!state.listing && state.listing.time).map(state => {
        console.log(`next screen`)
        console.log(state.listing)
        // document.listing = state.listing
        //
        // document.listing.location._mode = document.listing.location.mode
        // Object.defineProperty(document.listing.location, `mode`, {
        //   get: function () {
        //     return this._mode;
        //   },
        //   set: function (val) {
        //     this._mode = val;
        //   }
        // })

        document
        return {
          pathname: `/create/${state.listing.id}/description`,
          action: `PUSH`,
          state: state.listing
        }
      }))
      // state$.filter(state => !state.listing || !state.listing.id).map(state => ({
      //   pathname: `/create/name`,
      //   action: `PUSH`
      // }))
    ).flatten()
    .debug(`toNextScreen$...`)

  const toHTTP$ = actions.next$
    .map(() => xs.merge(
      state$.filter(state => !state.listing || !state.listing.id).map(state => ({
        url: `/auth_api/create/listing`,
        method: `post`,
        type: `json`,
        send: {
          type: `listing`,
          data: state.listing
        },
        category: `createListing`
      }))
    )).flatten()

  setWaiting$.imitate(toHTTP$)


  const toPreviousScreen$ = actions.back$
    .map(() => state$.map(state => {
      const prev = state.listing.location.mode === `address` ? `confirmAddressLocation` : `location`
      if (state.listing.id) {
        return {
          pathname: `/create/${state.listing.id}/${prev}`,
          action: `PUSH`,
          state: state.listing
        }
      } else {
        return {
          pathname: `/create/${prev}`,
          action: `PUSH`,
          state: state.listing
        }
      }
    }))
    .flatten()
    .debug(`time back$`)

    // return {
    //   DOM: xs.of(div([`Hello`])).debug(`name DOM...`),
    //   HTTP: xs.never(),
    //   Router: xs.never(),
    //   Global: xs.never(),
    //   Storage: xs.never(),
    //   MapDOM: xs.never(),
    //   message$: xs.never()
    // }

  return {
    DOM: vtree$,
    HTTP: toHTTP$,
    Router: xs.merge(toNextScreen$, toPreviousScreen$),
    Global: xs.merge(
      startDate.Global
    ),
    Storage: xs.never(),
    MapDOM: xs.never(),
    message$: state$
      .drop(1)
      .map(state => state.listing)
      .filter(listing => !!listing && listing.name)
      .map(listing => ({
        type: `listing`,
        data: listing
      }))
      //.debug(`listingType message`)
  }
}
