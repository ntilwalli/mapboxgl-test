import {Observable as O} from 'rxjs'
import {div, span, input, textarea, label, h6, nav, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, targetIsOwner} from '../../../../utils'
import {
  ListingTypes, CategoryTypes, 
  EventTypeToProperties
} from '../../../../listingTypes'
import {inflateSession, fromCheckbox, getDefaultSession} from '../../../helpers/listing/utils'
import clone = require('clone')

import SectionWrapper from '../sectionWrapper'
import Name from './name'
import Description from './description'
import Categories from './categories'
import EventTypes from './eventTypes'

import {renderSKFadingCircle6} from '../../../../library/spinners'




function intent(sources) {
  const {DOM, Global, Router} = sources
  const session$ = Router.history$
    .map(x => x.state.data)
    // .map(session => {
    //   //console.log(`meta session pre`, session)
    //   session.listing.type = session.listing.type || undefined
    //   session.listing.meta = session.listing.meta || {
    //     type: 'standard',
    //     title: undefined,
    //     description: undefined,
    //     short_description: undefined,
    //     event_types: [],
    //     categories: []
    //   }

    //   return session
    // })
    .map(inflateSession)
    .publishReplay(1).refCount()
  
  const open_instruction$ = DOM.select('.appOpenInstruction').events(`click`)
  const close_instruction$ = O.merge(
    Global.resize$,
    DOM.select('.appCloseInstruction').events(`click`)
  )

  const main_panel_click$ = DOM.select('.appMainPanel').events('click').filter(targetIsOwner)
  const go_to_preview$ = DOM.select('.appGoToPreviewButton').events('click').publish().refCount()
  return {
    session$,
    open_instruction$,
    close_instruction$,
    main_panel_click$,
    go_to_preview$
  }
}

function reducers(actions, inputs) {

  const open_instruction_r = actions.open_instruction$.map(_ => state => {
    return state.set('show_instruction', true)
  })

  const close_instruction_r = actions.close_instruction$.map(_ => state => {
    return state.set('show_instruction', false)
  })

  const properties_r = inputs.properties$.map(properties => state => {
    const session = state.get('session').toJS()
    let errors = []

    properties.forEach(p => {
      if (p.errors.length === 0) {
        p.apply(session, p.data)
      } else {
        errors = errors.concat(p.errors)
      }
    })

    return state.set('session', Immutable.fromJS(session)).set('errors', errors).set('valid', errors.length === 0)
  })

  const instruction_focus_r = inputs.instruction_focus$
    .map(x => state => {
      return state.set('focus', x)
    })

  const main_panel_click_r = actions.main_panel_click$.map(_ => state => {
    return state.set('focus', undefined)
  })

  const show_errors_r = actions.go_to_preview$.map(_ => state => {
    return state.set('show_errors', true)
  })

  return O.merge(properties_r, instruction_focus_r, open_instruction_r, close_instruction_r, main_panel_click_r, show_errors_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1),
      authorization$: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      //console.log('meta init', info)
      
      const session = info.session
      const init = {
        focus: undefined,
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

function has(arr, type) {
  return arr.some(val => val === type)
}

function renderNavigator(state) {
  const {authorization, waiting} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid.fixed-top', [
    div('.row.no-gutter', [
      div('.col-6', [
        button('.appBrandButton.hopscotch-icon.nav-brand', []),
        span('.ml-4.hidden-sm-down.step-description', ['Basics']),
        span('.ml-4.hidden-md-up.step-description', ['Basics'])
      ]),
      div('.col-6.d-fx-a-c.fx-j-e', [
        waiting ? span('.mr-4', [renderSKFadingCircle6()]) : null,
        button(`.appSaveExitButton.text-button.nav-text-button.btn.btn-link`, [`Save/Exit`])
      ]),
    ])
  ])
}

function renderMainPanel(info: any) {
  const {state, components} = info
  const {show_errors, errors} = state
  const {name, description, event_types, categories} = components
  return div(`.main-panel.container-fluid.mt-4`, {
    // hook: {
    //   create: (emptyVNode, {elm}) => {
    //     elm.scrollTop = 0
    //   }
    // }
  }, [
    show_errors && errors.length ? div(`.form-group`, [
      div(`.alerts-area`, errors.map(e => {
          return div(`.alert.alert-danger`, [
            e
          ])
      }))
    ]) : null,
    div([
      name
    ]),
    div('.mt-4', [
      description
    ]),
    div('.mt-4', [
      event_types,
    ]),
    div('.mt-4', [
      categories
    ])
  ])
}

function renderButtonPanel(info: any) {
  const {state} = info
  const {valid} = state
  return div(`.button-panel`, [
    button(`.appGoToPreviewButton`, {class: {disabled: false}}, [
      div(`.next`, [
        span(`.text`, [`Preview`]),
        span(`.fa.fa-angle-right.fa-2x`)
      ])
    ]),
    renderSmallInstructionPanel(info)
  ])
}

function renderInstructionPanel(info: any) {
  return div(`.instruction-panel`, [
    renderInstructionSubpanel(info)
  ])
}

function getInstruction(info) {
  const {state, components} = info
  const {focus} = state

  if (focus === 'listingName') {
    return 'Choose a name for the listing'
  } else {
    return 'Click on a section to see tips. Click \'Save/Exit\' to save save session (w/o posting) and resume later.'
  }

}


function renderSmallInstructionPanel(info) {
  const {state, components} = info
  const {show_instruction} = state
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
      div({style: {display: !!show_instruction ? 'block' : 'none'}}, [getInstruction(info)])
    ])
}

function renderInstructionSubpanel(info) {
  const {state, components} = info
  const {instruction} = components
  return div(`.instruction-panel`, [
    div(`.instruction-section`, [
      div([
        span(`.icon.fa.fa-lightbulb-o`),
        getInstruction(info)
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
    const {show_instruction} = state
    const {name} = components

    return div(`.screen.create-component`, [
      renderNavigator(state),
      div('.content-section.nav-fixed-offset.appMainPanel', [
        renderMainPanel(info),
        renderButtonPanel(info),
        renderInstructionPanel(info)
      ])
    ])
  })
}






// function view(state$, components) {
//   return combineObj({
//       state$, components: combineObj(components)
//     })
//     .map((info: any) => {
//       const {components} = info
//       const {name} = components

//       return name
//     })
// }

const toName = (session) => session.listing.meta.name

export function main(sources, inputs) {
  const actions = intent(sources)
  const show_errors$ = createProxy()

  const name = isolate(Name)(sources, {...inputs, session$: actions.session$, highlight_error$: show_errors$})
  const name_section = isolate(SectionWrapper)(sources, {component: name, title: 'Name', id: 'listingName'})
  
  const description = isolate(Description)(sources, {...inputs, session$: actions.session$, highlight_error$: show_errors$})
  const description_section = isolate(SectionWrapper)(sources, {component: description, title: 'Description', id: 'listingDescription'})
  
  const event_types = isolate(EventTypes)(sources, {...inputs, session$: actions.session$})
  const event_types_section = isolate(SectionWrapper)(sources, {component: event_types, title: 'Event types', id: 'listingEventTypes'})
  
  const categories = isolate(Categories)(sources, {...inputs, session$: actions.session$})
  const categories_section = isolate(SectionWrapper)(sources, {component: categories, title: 'Categories', id: 'listingCategories'})
  



  const instruction_focus$ = O.merge(name_section.focus$, description_section.focus$)
  const properties$ = O.combineLatest(
    name_section.output$,
    description_section.output$,
    event_types_section.output$,
    categories_section.output$
  )
  
  const components = {
    name: name_section.DOM,
    description: description_section.DOM,
    event_types: event_types_section.DOM,
    categories: categories_section.DOM
  }

  const merged = mergeSinks(name_section)
  const state$ = model(actions, {...inputs, properties$, instruction_focus$})
  const vtree$ = view(state$, components)

  show_errors$.attach(state$.pluck('show_errors').distinctUntilChanged().delay(1).map(x => {
    return x
  }))

  return {
    DOM: vtree$,
    Router: O.merge(
      actions.go_to_preview$.withLatestFrom(state$, (_, state) => {
        return state
      })
      .filter(state => state.valid)
      .map(state => {
        return {
          pathname: '/create/listing',
          type: 'push',
          state: {
            ...state,
            current_step: 'preview',
          }
        }
      })
    )
  }
}
