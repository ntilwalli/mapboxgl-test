import {Observable as O} from 'rxjs'
import {div, span, input, textarea, pre, label, h6, nav, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, targetIsOwner, processHTTP, toMessageBusMainError} from '../../../utils'
import {
  ListingTypes, CategoryTypes, 
  EventTypeToProperties
} from '../../../listingTypes'
import {inflateSession, deflateSession, fromCheckbox, getDefaultSession, isUpdateDisabled, renderDisabledAlert, renderSuccessAlert, getSessionClone, inflateListing, listingToSession} from '../../helpers/listing/utils'
import clone = require('clone')
import moment = require('moment')

import {renderSKFadingCircle6} from '../../../library/spinners'
import ConfirmModal from '../../../library/httpConfirmModal'
import MainAlert from '../../../library/pushState/mainAlert'

import DeleteListingQuery from '../../../query/deleteListing'

function intent(sources) {
  const {DOM, Global, Router} = sources
  
  const clone$ = DOM.select('.appCloneButton').events('click')
  const delete$ = DOM.select ('.appDeleteButton').events('click')
  const post$ = DOM.select('.appPostButton').events('click')
  const cancel$ = DOM.select('.appCancelButton').events('click')

  const confirm_delete$ = DOM.select('.appConfirmDelete').events('click')
  const confirm_post$ = DOM.select('.appConfirmPost').events('click')
  const confirm_cancel$ = DOM.select('.appConfirmCancel').events('click')

  const post_http = processHTTP(sources, 'cloneListing')
  const cancel_http = processHTTP(sources, 'cancelListing')

  return {
    clone$,
    delete$,
    post$,
    confirm_delete$,
    confirm_post$,
    confirm_cancel$,
    cancel$,
    post_http,
    cancel_http
  }
}

function reducers(actions, inputs) {
  const cancel_r = actions.cancel$.map(_ => state => {
    return state.set('show_confirm', 'cancel')
  })

  const delete_r = actions.delete$.map(_ => state => {
    return state.set('show_confirm', 'delete')
  })

  const post_r = actions.post$.map(_ => state => {
    return state.set('show_confirm', 'post')
  })
 
  return O.merge(cancel_r, delete_r, post_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$ || O.of({})
  return combineObj({
      session$: inputs.session$,
      listing_result$: inputs.listing_result$,
      authorization$: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      const session = info.session
      const listing_result = info.listing_result
      const init = {
        session,
        listing_result,
        authorization: info.authorization,
        show_confirm: undefined,
        cancel_status: undefined,
        post_status: undefined,
        delete_status: undefined
      }

      return reducer$
        .startWith(Immutable.fromJS(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .do(x => {
      console.log(`meta state`, x)
    })
    .publishReplay(1).refCount()
}

function renderMainPanel(info: any) {
  const {state} = info
  const {session} = state
  const {listing} = session
  const {release} = listing

  const is_update_disabled = isUpdateDisabled(state.session)

  return div([
    release === 'staged' ? button('.appPostButton.btn.btn-outline-success.d-flex.cursor-pointer.mb-4', {class: {"read-only": is_update_disabled}}, [
      span('.d-flex.align-items-center', ['Post listing']),
      //span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
    ]) : null,
    release === 'posted' ? button('.appCancelButton.btn.btn-outline-danger.d-flex.cursor-pointer.mb-4', {class: {"read-only": is_update_disabled}}, [
      span('.d-flex.align-items-center', ['Cancel listing']),
      //span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
    ]) : null
  ])
}

function view(state$, components) {
  return combineObj({
    state$, 
    components$: combineObj(components)
  }).map((info: any) => {
    const {state} = info
    const {session} = state
    const {listing} = session
    const {release} = listing

    const {confirm_modal} = info.components
    const is_update_disabled = isUpdateDisabled(info.state.session)
    const message = info.state.session.properties.admin.message
    return div('.basics.appMainPanel.pt-4', {
    }, [
      renderDisabledAlert(info.state.session),
      message ? renderSuccessAlert(message) : null,
      //pre([JSON.stringify(info.state.session.listing, undefined, 2)]),
      renderMainPanel(info),
      release === 'staged' || release === 'posted' ? button('.appDeleteButton.btn.btn-outline-danger.d-flex.cursor-pointer.mb-4', [
        span('.d-flex.align-items-center', ['Delete listing']),
        //span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
      ]) : null,
      button('.appCloneButton.btn.btn-outline-primary.d-flex.cursor-pointer', [
        span('.d-flex.align-items-center', ['Clone this listing']),
        //span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
      ]),
      confirm_modal ? confirm_modal : null
    ])
  })
}

function converter(session) {
  return session.listing.id
}

const common_cancel_modal_props = {
  route_confirm: '/listing/change_release_level',
  route_confirm_all: '/listing/change_release_level',
  converter_confirm: (session) => ({type: 'canceled', data: session.listing.id}),
  converter_confirm_all: (session) => ({type: 'canceled', data: session.listing.parent_id})
}

function getCancelModal(type, has_parent, sources, inputs) {
  if (type === 'single') {
    if (has_parent) {
      return isolate(ConfirmModal)(sources, {
        ...inputs, 
        props$: O.of({
          confirm_message: 'Yes, cancel this listing only',
          confirm_all_message: 'Yes, cancel this and future recurrences',
          reject_message: 'No, do not cancel',
          title: 'Cancel Listing Confirmation',
          message: 'This event recurs. Would you like to cancel this listing only or all future recurrences as well? Canceling a listing will remove the listing from search and a notification will be sent to all participating users that the listing is cancelled.',
          ...common_cancel_modal_props
        })
      })
    } else {
      return isolate(ConfirmModal)(sources, {
        ...inputs, 
        props$: O.of({
          confirm_message: 'Yes, cancel this listing',
          reject_message: 'No, do not cancel this listing',
          title: 'Cancel Listing Confirmation',
          message: 'Canceling this listing will remove the listing from search and a notification will be sent to all participating users that this listing is cancelled.',
          ...common_cancel_modal_props
        })
      })
    }
  } else {
    return isolate(ConfirmModal)(sources, {
      ...inputs, 
      props$: O.of({
        confirm_message: 'Yes, cancel this recurring listing',
        reject_message: 'No, do not cancel this recurring listing',
        title: 'Cancel Listing Confirmation',
        message: 'This listing recurs.  Canceling this listing will remove all upcoming recurrences from search and a notification will be sent to all participating users that the listing is cancelled.',
        ...common_cancel_modal_props
      })
    })
  }
}

function getDeleteModal(type, has_parent, sources, inputs) {
  return isolate(ConfirmModal)(sources, {...inputs, props$: O.of({
    confirm_message: 'Yes, delete this listing',
    reject_message: 'No, do not delete this listing',
    title: 'Delete Listing Confirmation',
    message: 'Deleting is only possible with staged listings.  Deleting will remove this listing from the system.  Are you sure you would like to delete this listing?',
    route_confirm: '/listing/delete',
    converter_confirm: (session) => session.listing.id,
  })})
}

function getPostModal(type, has_parent, sources, inputs) {
  if (type === 'single') {
    return isolate(ConfirmModal)(sources, {...inputs, props$: O.of({
      confirm_message: 'Yes, post this listing',
      reject_message: 'No, do not post this listing',
      title: 'Post Listing Confirmation',
      message: 'Posting this listing will add the listing from search and enable users to start using the interaction features.',
      route_confirm: '/listing/change_release_level',
      converter_confirm: (session) => ({type: 'posted', data: session.listing.id}),
    })})
  } else {
    return isolate(ConfirmModal)(sources, {...inputs, props$: O.of({
      confirm_message: 'Yes, post this recurring listing',
      reject_message: 'No, do not post this recurring listing',
      title: 'Post Recurring Listing Confirmation',
      message: 'This listing recurs.  Posting this listing will add cause recurrences to be generated up to 90 days in the future.  All generated listings will become searchable.',
      route_confirm: '/listing/change_release_level',
      converter_confirm: (session) => ({type: 'posted', data: session.listing.id}),
    })})
  }
}

function getModal(session, sources, inputs) {
  const admin = session.properties.admin
  const type = session.listing.type
  const has_parent = !!session.listing.parent_id
  if (admin && admin.modal) {
    const modal = admin.modal
    if (modal === 'cancel') {
      return getCancelModal(type, has_parent, sources, inputs)
    } else if (modal === 'delete') {
      return getDeleteModal(type, has_parent, sources, inputs)
    } else if (modal === 'post') {
      return getPostModal(type, has_parent, sources, inputs)
    } else {
      throw new Error('Invalid admin modal type: ' + type)
    }
  } else { 
    return {
      DOM: O.of(null),
      close$: O.never(),
      confirm$: O.never(), 
      confirm_all$: O.never()
    }
  }
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const confirm_modal$ =  inputs.session$.map(session => getModal(session, sources, inputs)).publishReplay(1).refCount()
  const confirm_modal: any = componentify(confirm_modal$)

  const state$ = model(actions, {
    ...inputs, 
    confirm_all$: confirm_modal$.switchMap(x => x.confirm_all$), 
    confirm$: confirm_modal$.switchMap(x => x.confirm$)
  })

  const components = {
    confirm_modal: confirm_modal.DOM
  }

  const vtree$ = view(state$, components)

  const delete_attempt$ = actions.confirm_delete$.withLatestFrom(state$, (_, state) => state.session.listing.id)

  const delete_listing_query = DeleteListingQuery(sources, {props$: delete_attempt$})

  const merged = mergeSinks(confirm_modal)
  return {
    ...merged,
    DOM: vtree$,
    Router: O.merge(
      merged.Router,
      delete_listing_query.success$
        .withLatestFrom(state$, (status, state) => {
          const listing = state.listing_result.session.listing
          const authorization = state.authorization

          const messages = [status]
          const pathname = '/' + authorization.username + '/listings'
          return {
            pathname,
            type: 'replace',
            state: {
              messages
            }
          }
        }),
      O.merge(actions.cancel$.mapTo('cancel'), actions.post$.mapTo('post'), actions.delete$.mapTo('delete'))
        .withLatestFrom(state$, (modal, state: any) => {
          const listing_result = state.listing_result
          listing_result.session.properties.admin.modal = modal
          return {
            pathname: sources.Router.createHref('/'),
            type: 'push',
            state: listing_result
          }
        }),
      actions.clone$
        .withLatestFrom(state$, (_, state: any) => {
          return {
            pathname: '/create/listing',
            type: 'push',
            state: getSessionClone(state.listing_result.session)
          }
        }),
      confirm_modal$.switchMap(x => x.close$)
        .withLatestFrom(state$, (_, state: any) => {
          const listing_result = state.listing_result
          listing_result.session.properties.admin.modal = undefined
          return {
            pathname: sources.Router.createHref('/'),
            type: 'replace',
            state: listing_result
          }
        }),
      confirm_modal$.switchMap(x => x.confirm$)
        .withLatestFrom(state$, (message, state) => {
          const listing_result = state.listing_result
          const modal = listing_result.session.properties.admin.modal
          if (modal === 'delete') {
            return {
              pathname: '/',
              type: 'push',
              state: [new MainAlert('Listing deleted successfully')]
            }
          } else if (modal === 'post') {
            const listing = inflateListing(message)
            listing_result.listing = listing
            listing_result.session = listingToSession(listing, listing_result.session.properties.donde.search_area)
            listing_result.session.properties.admin.message = 'Listing posted successfully'
            listing_result.session.properties.admin.modal = undefined
            return {
              pathname: sources.Router.createHref('/'),
              type: 'push',
              state: listing_result
            }
          } else if (modal === 'cancel') {
            const listing = inflateListing(message)
            listing_result.listing = listing
            listing_result.session = listingToSession(listing, listing_result.session.properties.donde.search_area)
            listing_result.session.properties.admin.message = 'Listing canceled successfully'
            listing_result.session.properties.admin.modal = undefined
            return {
              pathname: sources.Router.createHref('/'),
              type: 'push',
              state: listing_result
            }
          } else {
            throw new Error('Invalid admin modal type: ' + modal)
          }
        }),
      confirm_modal$.switchMap(x => x.confirm_all$)
        .withLatestFrom(state$, (message, state) => {
          const listing_result = state.listing_result
          const modal = listing_result.session.properties.admin.modal
          if (modal === 'cancel') {
            listing_result.session = listingToSession(inflateListing(message), listing_result.session.properties.donde.search_area)
            listing_result.session.properties.admin.message = 'This and future recurrences canceled successfully'
            return {
              pathname: sources.Router.createHref('/'),
              type: 'push',
              state: listing_result
            }
          } else {
            throw new Error('Invalid admin modal type: ' + modal)
          }
        })
    ),
    MessageBus: O.merge(
      merged.MessageBus,
      delete_listing_query.error$.map(toMessageBusMainError)
    ),
    output$: O.never()
  }
}
