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
import clone = require('clone')

import Content from './outputMain'

import {renderSKFadingCircle6} from '../../../../library/spinners'

const default_instruction = 'Click on a section to see tips'
function intent(sources) {
  const {DOM, Global, Router} = sources
  
  const open_instruction$ = DOM.select('.appOpenInstruction').events(`click`)
  const close_instruction$ = O.merge(
    Global.resize$,
    DOM.select('.appCloseInstruction').events(`click`)
  )

  const go_to_preview$ = DOM.select('.appGoToPreviewButton').events('click').publish().refCount()
  const go_to_advanced$ = DOM.select('.appGoToAdvancedButton').events('click').publish().refCount()
  const save_exit$ = DOM.select('.appSaveExitButton').events('click').publish().refCount()


  const saved_exit = processHTTP(sources, `saveExitSession`)
  const success_save_exit$ = saved_exit.success$
  const error_save_exit$ = saved_exit.error$

  return {
    open_instruction$,
    close_instruction$,
    go_to_preview$,
    go_to_advanced$,
    save_exit$,
    success_save_exit$,
    error_save_exit$, 
    show_errors$: O.merge(go_to_preview$, go_to_advanced$).mapTo(true).startWith(false)
  }
}

function reducers(actions, inputs) {

  const open_instruction_r = actions.open_instruction$.map(_ => state => {
    return state.set('show_instruction', true)
  })

  const close_instruction_r = actions.close_instruction$.map(_ => state => {
    return state.set('show_instruction', false)
  })

  const instruction_r = inputs.instruction_focus$
    .map(x => state => {
      return state.set('focus_instruction', x)
    })

  return O.merge(instruction_r, open_instruction_r, close_instruction_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      authorization$: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      //console.log('meta init', info)
      
      const session = info.session
      const init = {
        focus_instruction: undefined,
        show_instruction: false,
        authorization: info.authorization,
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

function renderInstructionPanel(info: any) {
  return div(`.instruction-panel`, [
    renderInstructionSubpanel(info)
  ])
}

function renderSmallInstructionPanel(info) {
  const {state, components} = info
  const {focus_instruction, show_instruction} = state
  return div('.small-instruction-panel', {
      class: {
        appOpenInstruction: !show_instruction,
        rounded: show_instruction,
        'rounded-circle': !show_instruction
      }
    }, [
      div([span(`.appCloseInstruction.close`, {style: {display: !!show_instruction ? 'inline' : 'none'}}, []),
      span(`.icon.fa.fa-lightbulb-o`)]),
      focus_instruction ? div({style: {display: !!show_instruction ? 'block' : 'none'}}, [focus_instruction]) : null
    ])
}

function renderInstructionSubpanel(info) {
  const {state, components} = info
  const {instruction} = components
  return div(`.instruction-panel`, [
    div(`.instruction-section`, [
      div([
        span(`.icon.fa.fa-lightbulb-o`),
        state.focus_instruction
      ])
    ])
  ])
}

function view(state$, components) {
  return combineObj({
    state$,
    components$: combineObj(components)
  }).map((info: any) => {
    const {state, components} = info
    const {show_instruction, authorization} = state
    const {content} = components

    return div(`.screen.create-component`, [
      div('.basics.content-section.nav-fixed-offset', {
        // hook: {
        //   create: (emptyVNode, {elm}) => {
        //     window.scrollTo(0, 0)
        //   },
        //   update: (old, {elm}) => {
        //     window.scrollTo(0, 0)
        //   }
        // }
      }, [
        div('.main-panel.container-fluid', [
          content,
          div('.appGoToAdvancedButton.mt-4.btn.btn-link.cursor-pointer.d-flex', {style: {"flex-flow": "row nowrap", flex: "0 0 fixed"}}, [
            span('.d-flex.align-items-center', ['Go to advanced settings']),
            span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
          ]),
          authorization ? button('.appSaveExitButton.mt-4.btn.btn-outline-warning.d-flex.cursor-pointer.mt-4', [
            span('.d-flex.align-items-center', ['Save/Finish later']),
            span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
          ]) : null,
          button('.appGoToPreviewButton.mt-4.btn.btn-outline-success.d-flex.cursor-pointer.mt-4', [
            span('.d-flex.align-items-center', ['Preview and post']),
            span('.fa.fa-angle-double-right.ml-2.d-flex.align-items-center', [])
          ]),
          renderSmallInstructionPanel(info),
          renderInstructionPanel(info)
        ])
      ])
    ])
  })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const content = Content(sources, {...inputs, show_errors$: actions.show_errors$})

  const state$ = model(actions, {...inputs, instruction_focus$: content.instruction_focus$})
  const vtree$ = view(state$, {content: content.DOM})

  const to_save_exit$ = actions.save_exit$.withLatestFrom(content.output$, (_, output) => {
    return {
      url: `/api/user`,
      method: `post`,
      category: `saveExitSession`,
      send: {
        route: `/listing_session/save`,
        data: output.session
      }
    }
  }).publish().refCount()

  const merged = mergeSinks(content)

  return {
    ...merged,
    DOM: vtree$,
    HTTP: O.merge(
      merged.HTTP,
      to_save_exit$
    ),
    Router: O.merge(
      merged.Router,
      actions.success_save_exit$.withLatestFrom(inputs.Authorization.status$, (_, user) => user)
        .map(user => {
          return {
            pathname: '/' + user.username + '/listings',
            action: 'REPLACE',
            type: 'replace'
          }
        }),
      actions.go_to_preview$.withLatestFrom(content.output$, (_, state) => {
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
      actions.go_to_advanced$.withLatestFrom(content.output$, (_, state) => {
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
