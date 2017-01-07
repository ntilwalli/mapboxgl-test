import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, em, ul, li, strong, button, img, span, i, a} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify, processHTTP} from '../../../utils'
import ComboBox from '../../../library/comboBox'
import {RecurrenceDisplayFilterOptions} from '../../../listingTypes'
import moment = require('moment')

import {
  renderName, renderNameWithParentLink, renderCuando, renderDonde, 
  renderCuandoStatus, renderCost, renderStageTime, renderPerformerSignup,
  renderPerformerLimit, renderTextList, renderNote, getFullCostAndStageTime,
  renderContactInfo, getFreqSummary, getDateTimeString, getCuandoStatus,
  getDondeNameString, getDondeCityString, getDondeStateString
}  from '../../helpers/listing/renderBootstrap'

function getListingLine(listing) {
  const {type, parent_id, cuando, meta} = listing
  if (type === 'single' && !parent_id)
    return meta.name + '/' + cuando.begins.format('lll')
  else if (type === 'single')
    return cuando.begins.format('lll')
  else
    return meta.name
}

function intent(sources) {
  const {DOM} = sources
  const delete$ = DOM.select('.appDeleteSession').events('click')
    .map(ev => ev.target.session)

  const go_to_session$ = DOM.select('.appGoToSession').events('click')
    .map(ev => ev.ownerTarget.session)
    .map(x => {
      return x
    })

  const {success$, error$} = processHTTP(sources, `deleteSession`)
  const delete_success$ = success$
    .publish().refCount()
  const delete_error$ = error$

  return {
    delete$,
    delete_success$,
    delete_error$,
    go_to_session$
  }
}

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.props$
    .map(props => {
      return {
        session: props,
        errors: []
      }
    })
    .map(x => Immutable.fromJS(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`home/profile state`, x))
    .publishReplay(1).refCount()
}


function renderSession(session) {
  const {properties, listing, updated_at, inserted_at} = session
  return div('.card-block', [
    div('.row', [
      div('.col-xs-12.d-flex.fx-column', [
        span('.d-fx-a-c.fx-j-sb', [
          button('.appGoToSession.btn.btn-link', {props: {session}}, [
            strong([listing && listing.meta && listing.meta.name ? listing.meta.name : 'Unnamed listing ' + session.id])
          ]),
          button('.appDeleteSession.fa.fa-1-5x.fa-trash-o.btn.btn-link', {props: {session}}, [])
        ]),
        span([span(['Started: ']), span([inserted_at.local().format('lll')])]),
        span([span(['Last updated: ']), span([updated_at.local().format('lll')])])
      ])
    ])
  ])
}

function view(state$) {
  return combineObj({
      state$,
      //components: combineObj(components)
    }).map((info: any) => {
      const {state} = info
      const {session} = state
      const out =  div('.card', [
        renderSession(session)
      ])

      return out
    })
}

export default function main(sources, inputs) {
  const shared$ = inputs.props$.publishReplay(1).refCount()
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  // const components = {
  //   filter_type: filter_type_combo.DOM
  // }
  const vtree$ = view(state$)
  //const merged = mergeSinks(filter_type_combo)
  const to_http$ = actions.delete$
    .map(session => {
      return {
        url: `/api/user`,
        method: `post`,
        category: `deleteSession`,
        send: {
          route: `/listing_session/delete`,
          data: session.id
        }
      }
    })

  return {
    //...merged,
    DOM: vtree$,
    HTTP: to_http$,
    Router: O.merge(
      actions.go_to_session$.map(x => {
        return  {
          pathname: '/create/listing',
          type: 'push',
          state: {
            type: 'retrieve',
            data: x.id
          }
        }
      }),
      actions.delete_success$.map(x => {
        return  {
          pathname: '/home/listings',
          type: 'replace'
        }
      })
    ),
    errors$: actions.delete_error$
  }
}