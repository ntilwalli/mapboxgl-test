import xs from 'xstream'
//import dropRepeats from 'xstream/extra/dropRepeats'
import view from './view'
import intent from './intent'
import model from './model'
import VirtualDOM from 'virtual-dom'

import {div} from '@cycle/DOM'
import combineObj from '../../../combineObj'

import AutocompleteInput from '../../../general/autocompleteInput'
import RadioInput from '../../../general/radioInput'

import {noopListener} from '../../../utils'

const VNode = VirtualDOM.VNode

export default function main(sources, inputs) {

  const radioInput = RadioInput(sources, {
    styleClass: `.circle`,
    options: [{
      displayValue: `One-off`,
      value: `single`
    },{
      displayValue: `Group`,
      value: `group`
    }],
    props$: inputs.listing$
      //.debug(`inputs.listing$`)
      .map(listing => listing && listing.type)
      .map(type => ({selected: type}))
  })

  const actions = intent(sources)

  const setWaiting$ = xs.create()

  const state$ = model(actions, {...inputs, radio$: radioInput.selected$.drop(1)})  // drop 1 because radioInput emits based on props which is already used initially to set up the local state
  const vtree$ = view({state$, components: {radio: radioInput.DOM}})

  // radioProps$.imitate(
  //   inputs.listing$
  //     .map(listing => listing && listing.type)
  //     .map(type => ({selected: type}))
  //     .take(1)
  // )

  const toNextScreen$ = actions.next$
    .map(() => xs.merge(
      state$.filter(state => state.listing && state.listing.type && state.listing.id).map(state => ({
        pathname: `/create/${state.listing.id}/name`,
        action: `PUSH`,
        state: state.listing
      })),
      state$.filter(state => state.listing && state.listing.type && !state.listing.id).map(state => ({
        pathname: `/create/name`,
        action: `PUSH`,
        state: state.listing
      }))
    ))
    .flatten()
    .debug(`toNextScreen$...`)

  // const toHTTP$ = actions.next$
  //   .map(() => xs.merge(
  //     state$.filter(state => !state.listing || !state.listing.id).map(state => ({
  //       url: `/auth_api/create/listing`,
  //       method: `post`,
  //       type: `json`,
  //       send: {
  //         type: `listing`,
  //         data: state.listing
  //       },
  //       category: `createListing`
  //     }))
  //   )).flatten()
  //
  // setWaiting$.imitate(toHTTP$)


  const toPreviousScreen$ = actions.back$
    .map(() => state$.map(state => {
      if (state.listing) {
        if (state.listing.id) {
          return {
            pathname: `/create/${state.listing.id}`,
            action: `PUSH`,
            state: state.listing
          }
        } else {
          return {
            pathname: `/create`,
            action: `PUSH`,
            state: state.listing
          }
        }
      } else {
        return {
          pathname: `/create`,
          action: `PUSH`
        }
      }
    }))
    .flatten()
    .debug(`listingType back$`)


    return {
      DOM: vtree$,
      HTTP: xs.never(),// toHTTP$,
      Router: xs.merge(
          //actions.fromHTTPError$.mapTo(`/restricted`),
          toNextScreen$,
          toPreviousScreen$
        ),
      Global: xs.never(),
      Storage: xs.never(),
      MapDOM: xs.never(),
      message$: state$
        .drop(1)
        .map(state => state.listing)
        .filter(listing => !!listing && listing.type)
        .map(listing => ({
          type: `listing`,
          data: listing
        }))
        .debug(`listingType message`)
    }
}
