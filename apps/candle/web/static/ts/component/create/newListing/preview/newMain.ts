import {Observable as O} from 'rxjs'
import {div, span, input, textarea, label, h6, nav, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, targetIsOwner, processHTTP} from '../../../../utils'
import {
  ListingTypes, CategoryTypes, 
  EventTypeToProperties
} from '../../../../listingTypes'
import {inflateSession, deflateSession, fromCheckbox, getDefaultSession} from '../../../helpers/listing/utils'

import mapview from './mapview'
import contentView from './view'

import clone = require('clone')

import FocusWrapper from '../focusWrapperWithInstruction'

import {renderSKFadingCircle6} from '../../../../library/spinners'

const default_instruction = 'Click on a section to see tips'
function intent(sources) {
  const {DOM, Global, Router} = sources
  const session$ = Router.history$
    .map(x => {
      return inflateSession(x.state.data)
    })
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  
  const open_instruction$ = DOM.select('.appOpenInstruction').events(`click`)
  const close_instruction$ = O.merge(
    Global.resize$,
    DOM.select('.appCloseInstruction').events(`click`)
  )

  const main_panel_click$ = DOM.select('.appMainPanel').events('click').filter(targetIsOwner)
    .mapTo(default_instruction)
  const go_to_basics$ = DOM.select('.appGoToBasicsButton').events('click').publish().refCount()
  const go_to_advanced$ = DOM.select('.appGoToAdvancedButton').events('click').publish().refCount()
  const save_exit$ = DOM.select('.appSaveExitButton').events('click').publish().refCount()


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
    open_instruction$,
    close_instruction$,
    main_panel_click$,
    go_to_basics$,
    go_to_advanced$,

    attempt_post$,
    attempt_stage$,
    post_success$,
    post_error$,
    stage_success$,
    stage_error$
  }
}

function reducers(actions, inputs) {

  const open_instruction_r = actions.open_instruction$.map(_ => state => {
    return state.set('show_instruction', true)
  })

  const close_instruction_r = actions.close_instruction$.map(_ => state => {
    return state.set('show_instruction', false)
  })

  return O.merge(open_instruction_r, close_instruction_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$,
      authorization$: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      //console.log('meta init', info)
      
      const session = info.session
      const init = {
        focus_instruction: "Verify the listing information, go back and fix the listing if necessary.  You can then either stage the listing or post it!",
        show_instruction: false,
        authorization: info.authorization,
        waiting: false,
        errors: [],
        show_errors: false,
        session,
        valid: false
      }

      return reducer$
        .startWith(Immutable.fromJS(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`meta state`, x))
    .publishReplay(1).refCount()
}

function renderMainPanel(info: any) {
  const {state} = info
  return div(`.main-panel.container-fluid.mt-4`, [
    contentView(info)
  ])
}

function renderInstructionPanel(info: any) {
  return div(`.instruction-panel`, [
    renderInstructionSubpanel(info)
  ])
}

function renderSmallInstructionPanel(info) {
  const {state} = info
  const {focus_instruction, show_instruction} = state
  return div('.small-instruction-panel', {
      class: {
        appOpenInstruction: !show_instruction,
        rounded: show_instruction,
        'rounded-circle': !show_instruction
        //hide: !show_instruction
      }
    }, [
      div([span(`.appCloseInstruction.close`, {style: {display: !!show_instruction ? 'inline' : 'none'}}, []),
      span(`.icon.fa.fa-lightbulb-o`)]),
      div({style: {display: !!show_instruction ? 'block' : 'none'}}, [focus_instruction])
    ])
}

function renderInstructionSubpanel(info) {
  const {state} = info
  return div(`.instruction-panel`, [
    div(`.instruction-section`, [
      div([
        span(`.icon.fa.fa-lightbulb-o`),
        state.focus_instruction
      ])
    ])
  ])
}

function view(state$) {
  return combineObj({
    state$
  }).map((info: any) => {
    const {state} = info
    const {show_instruction} = state

    return div(`.screen.create-component`, [
      div('.basics.content-section.nav-fixed-offset.appMainPanel', {
        // hook: {
        //   create: (emptyVNode, {elm}) => {
        //     window.scrollTo(0, 0)
        //   },
        //   update: (old, {elm}) => {
        //     window.scrollTo(0, 0)
        //   }
        // }
      }, [
        renderMainPanel(info),
        renderSmallInstructionPanel(info),
        renderInstructionPanel(info)
      ])
    ])
  })
}

const toName = (session) => session.listing.meta.name

export function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)

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
    MapJSON: mapview(state$),
    HTTP: O.merge(
      stage$,
      post$
    ),
    Router: O.merge(
      to_router$,
      actions.go_to_basics$.withLatestFrom(state$, (_, state) => {
          return state
        })
        .filter(state => state.valid)
        .map(state => {
          return {
            pathname: '/create/listing',
            type: 'push',
            state: {
              type: 'session',
              data: {
                ...deflateSession(state.session),
                current_step: 'preview'
              }
            }
          }
        }),
      actions.go_to_advanced$
        .withLatestFrom(state$, (_, state) => {
            return state
          })
        .filter(state => state.valid)
        .map(state => {
          return {
            pathname: '/create/listing',
            type: 'push',
            state: {
              type: 'session',
              data: {
                ...deflateSession(state.session),
                current_step: 'advanced'
              }
            }
          }
        })
    )
  }
}
