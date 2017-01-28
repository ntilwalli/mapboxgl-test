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

import FocusWrapper from '../focusWrapperWithInstruction'
import FocusCardWrapper from '../focusCardWrapper'
import Name from './name'
import Description from './description'
import Categories from './categories'
import EventTypes from './eventTypes'
import Venue from './donde/venue'
import SearchArea from './donde/searchArea'
import ListingType from './listingType'
import StartTime from './cuando/times/startTime'
import EndTime from './cuando/times/endTime'
import SingleDate from './cuando/date'
import Recurrence from './cuando/recurrence/main'

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
  const go_to_preview$ = DOM.select('.appGoToPreviewButton').events('click').publish().refCount()
  const go_to_advanced$ = DOM.select('.appGoToAdvancedButton').events('click').publish().refCount()
  const save_exit$ = DOM.select('.appSaveExitButton').events('click').publish().refCount()


  const saved_exit = processHTTP(sources, `saveExitSession`)
  const success_save_exit$ = saved_exit.success$
  const error_save_exit$ = saved_exit.error$

  return {
    session$,
    open_instruction$,
    close_instruction$,
    main_panel_click$,
    go_to_preview$,
    go_to_advanced$,
    save_exit$,
    success_save_exit$,
    error_save_exit$
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

    if (!session.listing.donde) {
      errors.push('Venue: Must be selected')
    } 
    
    if (session.listing.type === ListingTypes.SINGLE) {
      if (!session.listing.cuando.begins) {
        errors.push('Start date/time: Must be set')
      }
    } else {
      if (!session.listing.cuando.rrules.length && !session.listing.cuando.rdates.length) {
        errors.push('Recurrence: Rule or dates must be selected')
      }
    }

    return state.set('session', Immutable.fromJS(session)).set('errors', errors).set('valid', errors.length === 0)
  })

  const instruction_r = O.merge(inputs.instruction_focus$, actions.main_panel_click$)
    .map(x => state => {
      return state.set('focus_instruction', x)
    })

  // const main_panel_click_r = actions.main_panel_click$.map(_ => state => {
  //   return state.set('focus', undefined)
  // })

  const show_errors_r = O.merge(actions.go_to_preview$, actions.go_to_advanced$).map(_ => state => {
    return state.set('show_errors', true)
  })

  return O.merge(properties_r, instruction_r, open_instruction_r, close_instruction_r, show_errors_r)
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
        focus_instruction: default_instruction,
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

function renderMainPanel(info: any) {
  const {state, components} = info
  const {show_errors, errors, authorization} = state
  const {
    name, description, event_types, categories, 
    search_area, donde, listing_type, start_time,
    end_time, date
  } = components
  return div(`.main-panel.container-fluid.mt-4`, [
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
    ]),
    div('.mt-4', [
      end_time
    ]),
    div('.mt-4', [
      date
    ]),
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
    ])
  ])
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
        //hide: !show_instruction
      }
    }, [
      div([span(`.appCloseInstruction.close`, {style: {display: !!show_instruction ? 'inline' : 'none'}}, []),
      span(`.icon.fa.fa-lightbulb-o`)]),
      div({style: {display: !!show_instruction ? 'block' : 'none'}}, [focus_instruction || default_instruction])
    ])
}

function renderInstructionSubpanel(info) {
  const {state, components} = info
  const {instruction} = components
  return div(`.instruction-panel`, [
    div(`.instruction-section`, [
      div([
        span(`.icon.fa.fa-lightbulb-o`),
        state.focus_instruction || default_instruction
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
  const show_errors$ = createProxy()

  const name_instruction = 'Choose a name for the listing'
  const name = isolate(Name)(sources, {...inputs, session$: actions.session$, highlight_error$: show_errors$})
  const name_section: any = isolate(FocusWrapper)(sources, {component: name, title: 'Name', instruction: name_instruction})
  
  const description_instruction = 'Describe the listing'
  const description = isolate(Description)(sources, {...inputs, session$: actions.session$, highlight_error$: show_errors$})
  const description_section: any = isolate(FocusWrapper)(sources, {component: description, title: 'Description', instruction: description_instruction})
  
  const event_types_instruction = 'Choosing the right event type(s) allows you to configure additional properties like the performer sign-up start time (open-mic) or audience cost (show) if relevant.'
  const event_types = isolate(EventTypes)(sources, {...inputs, session$: actions.session$})
  const event_types_section: any = isolate(FocusWrapper)(sources, {component: event_types, title: 'Event types', instruction: event_types_instruction})
  
  const categories_instruction = 'Categories determine what filters apply to the listing during search'
  const categories = isolate(Categories)(sources, {...inputs, session$: actions.session$})
  const categories_section: any = isolate(FocusWrapper)(sources, {component: categories, title: 'Categories', instruction: categories_instruction})
  
  const search_area_instruction = 'Select the city/region to use for the venue autocomplete'
  const search_area = isolate(SearchArea)(sources, {...inputs, session$: actions.session$})
  const search_area_section: any = isolate(FocusWrapper)(sources, {component: search_area, title: 'Search area', instruction: search_area_instruction})

  const donde_instruction = 'Select the venue'
  const donde_invalid$ = show_errors$.startWith(false)
  const donde = isolate(Venue)(sources, {...inputs, session$: actions.session$, search_area$: search_area_section.output$.pluck('data'), highlight_error$: donde_invalid$})
  const donde_section: any = isolate(FocusWrapper)(sources, {component: donde, title: 'Venue', instruction: donde_instruction})

  const listing_type_instruction = 'Does this listing represent a single (one-off) event or an event which recurs?'
  const listing_type = isolate(ListingType)(sources, {...inputs, session$: actions.session$})
  const listing_type_section: any = isolate(FocusWrapper)(sources, {component: listing_type, title: 'Type', instruction: listing_type_instruction})

  const start_time_instruction = 'Set the start time of the event'
  const start_time = isolate(StartTime)(sources, {...inputs, session$: actions.session$})
  const start_time_section: any = isolate(FocusWrapper)(sources, {component: start_time, title: 'Start time', instruction: start_time_instruction})

  const end_time_instruction = 'Set the end time of the event (optional)'
  const end_time = isolate(EndTime)(sources, {...inputs, session$: actions.session$})
  const end_time_section: any = isolate(FocusWrapper)(sources, {component: end_time, title: 'End time', instruction: end_time_instruction})

  const date_section$ = listing_type_section.output$.pluck('data')
    .map(type => {
      if (type === ListingTypes.SINGLE) {
        const date_instruction = 'Choose the event date'
        const single_date = isolate(SingleDate)(sources, {...inputs, session$: actions.session$})
        const single_date_section: any = isolate(FocusWrapper)(sources, {component: single_date, title: 'Date', instruction: date_instruction})
        return single_date_section
      } else {
        const recurrence_instruction = 'Choose a rule for regular (weekly, monthly) events and/or select and exclude dates by clicking the calendar'
        const recurrence = isolate(Recurrence)(sources, {...inputs, session$: actions.session$})
        const recurrence_section: any = isolate(FocusWrapper)(sources, {
          component: recurrence, 
          title: 'Recurrence dates', 
          instruction: recurrence_instruction, 
          skip_children: true
        })
        return recurrence_section
      }
    }).publishReplay(1).refCount()

  const date_section = componentify(date_section$)

  const instruction_focus$ = O.merge(
    name_section.focus$, 
    description_section.focus$, 
    event_types_section.focus$, 
    categories_section.focus$,
    search_area_section.focus$,
    donde_section.focus$,
    listing_type_section.focus$,
    start_time_section.focus$,
    end_time_section.focus$,
    date_section$.switchMap(x => x.focus$)
  )

  const properties$ = O.combineLatest(
    name_section.output$,
    description_section.output$,
    event_types_section.output$,
    categories_section.output$,
    search_area_section.output$,
    donde_section.output$,
    listing_type_section.output$,
    start_time_section.output$,
    end_time_section.output$,
    date_section$.switchMap(x => x.output$)
  )
  
  const components = {
    name: name_section.DOM,
    description: description_section.DOM,
    event_types: event_types_section.DOM,
    categories: categories_section.DOM,
    search_area: search_area_section.DOM,
    donde: donde_section.DOM,
    listing_type: listing_type_section.DOM,
    start_time: start_time_section.DOM,
    end_time: end_time_section.DOM,
    date: date_section.DOM
  }

  const merged = mergeSinks(
    name_section, 
    description_section, 
    event_types_section, 
    categories_section, 
    search_area_section,
    donde_section,
    listing_type_section,
    start_time_section,
    end_time_section,
    date_section
  )

  const state$ = model(actions, {...inputs, properties$, instruction_focus$})
  const vtree$ = view(state$, components)

  show_errors$.attach(state$.pluck('show_errors').distinctUntilChanged().delay(1).map(x => {
    return x
  }))

  const to_save_exit$ = actions.save_exit$.withLatestFrom(state$, (_, state) => {
    return {
      url: `/api/user`,
      method: `post`,
      category: `saveExitSession`,
      send: {
        route: `/listing_session/save`,
        data: state.session
      }
    }
  }).publish().refCount()

  const to_http$ = O.merge(
    merged.HTTP,
    to_save_exit$
  ).publish().refCount()

  // to_http$.subscribe(x => {
  //   console.log('to_http', x)
  // })

  return {
    ...merged,
    DOM: vtree$,
    HTTP: to_http$,
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
                ...deflateSession(state.session),
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
        }).skip(1),
      actions.go_to_advanced$.withLatestFrom(state$, (_, state) => {
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
