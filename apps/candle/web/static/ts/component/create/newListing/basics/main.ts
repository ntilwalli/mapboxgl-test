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

import FocusWrapper from '../focusWrapper'
import FocusCardWrapper from '../focusCardWrapper'
import Name from './name'
import Description from './description'
import Categories from './categories'
import EventTypes from './eventTypes'
import Venue from './donde/venue'
import SearchArea from './donde/searchArea'
import ListingType from './listingType'
import StartTime from './cuando/times/startTime'

import {renderSKFadingCircle6} from '../../../../library/spinners'

function intent(sources) {
  const {DOM, Global, Router} = sources
  const session$ = Router.history$
    .map(x => {
      return x.state.data
    })
    .map(x => {
      return inflateSession(x)
    })
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
      const as_array = !Array.isArray(p) ? [p] : p
      as_array.forEach(p => {
        if (p.errors.length === 0) {
          p.apply(session, p.data)
        } else {
          errors = errors.concat(p.errors)
        }
      })
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
      session$: actions.session$,
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
  const {name, description, event_types, categories, search_area, donde, listing_type, start_time} = components
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
      listing_type
    ]),
    div('.mt-4', [
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
    ]),
    div('.mt-4', [
      search_area
    ]),
    div('.mt-4', [
      donde
    ]),
    div('.mt-4', [
      start_time
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

  if (focus === 'name') {
    return 'Choose a name for the listing'
  } else if (focus === 'description') {
    return 'Describe the listing'
  } else if (focus === 'categories') {
    return 'Categories determine what filters apply to the listing during search'
  } else if (focus === 'event_types') {
    return 'Choosing the right event type(s) allows you to configure additional properties like the performer sign-up start time (open-mic) or audience cost (show) if relevant.'
  } else if (focus === 'search_area') {
    return 'Select the city/region to use for the venue autocomplete'
  } else if (focus === 'donde') {
    return 'Select the venue'
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
  const name_section: any = isolate(FocusWrapper)(sources, {component: name, title: 'Name', id: 'name'})
  
  const description = isolate(Description)(sources, {...inputs, session$: actions.session$, highlight_error$: show_errors$})
  const description_section: any = isolate(FocusWrapper)(sources, {component: description, title: 'Description', id: 'description'})
  
  const event_types = isolate(EventTypes)(sources, {...inputs, session$: actions.session$})
  const event_types_section: any = isolate(FocusWrapper)(sources, {component: event_types, title: 'Event types', id: 'event_types'})
  
  const categories = isolate(Categories)(sources, {...inputs, session$: actions.session$})
  const categories_section: any = isolate(FocusWrapper)(sources, {component: categories, title: 'Categories', id: 'categories'})
  
  const search_area = isolate(SearchArea)(sources, {...inputs, session$: actions.session$})
  const search_area_section: any = isolate(FocusWrapper)(sources, {component: search_area, title: 'Search area', id: 'search_area'})

  const donde = isolate(Venue)(sources, {...inputs, session$: actions.session$})
  const donde_section: any = isolate(FocusWrapper)(sources, {component: donde, title: 'Venue', id: 'donde'})

  const listing_type = isolate(ListingType)(sources, {...inputs, session$: actions.session$})
  const listing_type_section: any = isolate(FocusWrapper)(sources, {component: listing_type, title: 'Type', id: 'listing_type'})

  const start_time = isolate(StartTime)(sources, {...inputs, session$: actions.session$})
  const start_time_section: any = isolate(FocusWrapper)(sources, {component: start_time, title: 'Start time', id: 'start_time'})



  const instruction_focus$ = O.merge(
    name_section.focus$, 
    description_section.focus$, 
    event_types_section.focus$, 
    categories_section.focus$,
    search_area_section.focus$,
    donde_section.focus$,
    listing_type_section.focus$,
    start_time_section.focus$
  )

  const properties$ = O.combineLatest(
    name_section.output$,
    description_section.output$,
    event_types_section.output$,
    categories_section.output$,
    search_area_section.output$,
    donde_section.output$,
    listing_type_section.output$,
    start_time_section.output$
  )
  
  const components = {
    name: name_section.DOM,
    description: description_section.DOM,
    event_types: event_types_section.DOM,
    categories: categories_section.DOM,
    search_area: search_area_section.DOM,
    donde: donde_section.DOM,
    listing_type: listing_type_section.DOM,
    start_time: start_time_section.DOM
  }

  const merged = mergeSinks(
    name_section, 
    description_section, 
    event_types_section, 
    categories_section, 
    search_area_section,
    donde_section,
    listing_type_section,
    start_time_section
  )

  const state$ = model(actions, {...inputs, properties$, instruction_focus$})
  const vtree$ = view(state$, components)

  show_errors$.attach(state$.pluck('show_errors').distinctUntilChanged().delay(1).map(x => {
    return x
  }))

  return {
    ...merged,
    DOM: vtree$,
    Router: O.merge(
      //merged.Router,
      actions.go_to_preview$.withLatestFrom(state$, (_, state) => {
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
                ...state,
                current_step: 'preview'
              }
            }
          }
        }),
      state$.map((x: any) => x.session.properties.donde.modal).distinctUntilChanged()
        .withLatestFrom(state$, (_, state: any) => {
          return {
            pathname: '/create/listing',
            type: 'push',
            state: {
              type: 'session', 
              data: state.session
            }
          }
        }).skip(1)
    )
  }
}
