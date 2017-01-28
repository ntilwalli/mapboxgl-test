import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, processHTTP} from '../../../../utils'
import mapview from './mapview'
import view from './view'
import {inflateSession, fromCheckbox} from '../../../helpers/listing/utils'

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .map(x => x.state.data)
    .map(inflateSession)
    .publishReplay(1).refCount()
  
  const attempt_post$ = DOM.select('.appPostButton').events('click')
  const attempt_stage$ = DOM.select('.appStageButton').events('click')

  const post_streams = processHTTP(sources, 'postListing')
  const stage_streams = processHTTP(sources, 'stageListing')
  const post_success$ = post_streams.success$
  const post_error$ = post_streams.error$
  const stage_success$ = stage_streams.success$
  const stage_error$ = stage_streams.error$

  return {
    session$,
    attempt_post$,
    attempt_stage$,
    post_success$,
    post_error$,
    stage_success$,
    stage_error$
  }
}

function reducers(actions, inputs) {
  return O.merge(O.never())
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1),
      authorization: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      return reducer$
        .startWith(Immutable.Map(info))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .map((x: any) => ({
      ...x,
      valid: true
    }))
    //.do(x => console.log(`preview state`, x))
    .publishReplay(1).refCount()
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const mapvtree$ = mapview(state$)
  const vtree$ = view(state$, {})

  const post$ = actions.attempt_post$
    .withLatestFrom(state$, (_, state) => {
      state.session.listing.release = 'posted'
      state.session.listing.visibility = 'public'

      return {
        url: `/api/user`,
        method: `post`,
        category: `postListing`,
        send: {
          route: `/listing/new`,
          data: state.session.listing
        }
      }
    })

  const stage$ = actions.attempt_stage$
    .withLatestFrom(state$, (_, state) => {
      state.session.listing.release = 'staged'
      state.session.listing.visibility = 'public'
      return {
        url: `/api/user`,
        method: `post`,
        category: `stageListing`,
        send: {
          route: `/listing/new`,
          data: state.session.listing
        }
      }
    })

  const to_router$ = O.merge(
      actions.post_success$,
      actions.stage_success$
    )
    .withLatestFrom(inputs.Authorization.status$, (_, user: any) => {
      return {
        pathname: '/' + user.username + '/listings',
        action: 'REPLACE',
        type: 'replace'
      }
    })

  return {
    DOM: vtree$,
    HTTP: O.merge(post$, stage$),
    Router: to_router$,
    MapJSON: mapvtree$,
    output$: state$
  }
}
