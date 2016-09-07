import xs from 'xstream'
//import dropRepeats from 'xstream/extra/dropRepeats'
import view from './view'
import intent from './intent'
import model from './model'
import VirtualDOM from 'virtual-dom'

import {div} from '@cycle/DOM'
import combineObj from '../../../combineObj'

import {noopListener} from '../../../utils'

export default function main(sources, inputs) {

  const actions = intent(sources)

  const setWaiting$ = xs.create()

  const state$ = model(actions, {...inputs, setWaiting$})  // drop 1 because radioInput emits based on props which is already used initially to set up the local state
  const vtree$ = view(state$).debug(`from name vtree$`)

  // radioProps$.imitate(
  //   inputs.listing$
  //     .map(listing => listing && listing.type)
  //     .map(type => ({selected: type}))
  //     .take(1)
  // )

  const toNextScreen$ = actions.next$
    .map(() => xs.merge(
      state$.filter(state => !!state.listing && state.listing.name && state.listing.id).map(state => {
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
          pathname: `/create/${state.listing.id}/location`,
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
      if (state.listing.id) {
        return {
          pathname: `/create/${state.listing.id}/listingType`,
          action: `PUSH`,
          state: state.listing
        }
      } else {
        return {
          pathname: `/create/listingType`,
          action: `PUSH`,
          state: state.listing
        }
      }
    }))
    .flatten()
    .debug(`name back$`)

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
    Router: xs.merge(
      actions.fromHTTPError$.mapTo(`/restricted`),
      toNextScreen$,
      toPreviousScreen$),
    Global: xs.never(),
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
