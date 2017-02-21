import {Observable as O} from 'rxjs'
import {div, span, input, textarea, label, h6, nav, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, targetIsOwner, processHTTP} from '../../../../utils'
import {
  ListingTypes, CategoryTypes, 
  EventTypeToProperties
} from '../../../../listingTypes'
import {
  inflateSession, 
  deflateSession, 
  fromCheckbox, 
  getDefaultSession,
  findEventTypeShow,
  findEventTypeDance
} from '../../../helpers/listing/utils'
import clone = require('clone')

import FocusWrapper from '../focusWrapperWithInstruction'
import FocusCardWrapper from '../focusCardWrapper'
import Name from './name'
import Description from './description'
import EventTypesAndCategories from './structuredEventTypesAndCategories'
import Venue from './donde/venue'
import SearchArea from './donde/searchArea'
import ListingType from './listingType'
import StartTime from './cuando/times/startTime'
import EndTime from './cuando/times/endTime'
import DoorTime from './cuando/times/doorTime'
import UndefinedDoorTime from './cuando/times/undefinedDoorTime'
import SingleDate from './cuando/date'
import Recurrence from './cuando/recurrence/main'

import {renderSKFadingCircle6} from '../../../../library/spinners'

const default_instruction = 'Click on a section to see tips'
function intent(sources) {
  const {DOM, Global, Router} = sources
  
  const main_panel_click$ = DOM.select('.appMainPanel').events('click').filter(targetIsOwner)
    .mapTo(default_instruction)

  return {
    main_panel_click$
  }
}

function reducers(actions, inputs) {

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

  const show_errors_r = inputs.show_errors$.map(val => state => {
    return state.set('show_errors', val)
  })

  return O.merge(properties_r, show_errors_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: inputs.session$,
    })
    .switchMap((info: any) => {
      //console.log('meta init', info)
      
      const session = info.session
      const init = {
        errors: [],
        show_errors: undefined,
        session,
        valid: false
      }

      return reducer$
        .startWith(Immutable.fromJS(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    // .do(x => {
    //   console.log(`meta state`, x)
    // })
    .publishReplay(1).refCount()
}

function renderMainPanel(info: any) {
  const {state, components} = info
  const {show_errors, errors} = state
  const {
    name, description, event_types_and_categories,
    search_area, donde, listing_type, start_time,
    end_time, door_time, date
  } = components
  return div(`.pt-4`, [
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
      event_types_and_categories,
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
      door_time
    ]),
    div('.mt-4', [
      date
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

    return div('.basics.appMainPanel', {
        // hook: {
        //   create: (emptyVNode, {elm}) => {
        //     window.scrollTo(0, 0)
        //   },
        //   update: (old, {elm}) => {
        //     window.scrollTo(0, 0)
        //   }
        // }
    }, [
      renderMainPanel(info)
    ])
  })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const show_errors$ = inputs.show_errors$.publishReplay(1).refCount()

  const name_instruction = 'Choose a name for the listing'
  const name = isolate(Name)(sources, {...inputs, session$: inputs.session$, highlight_error$: show_errors$})
  const name_section: any = isolate(FocusWrapper)(sources, {component: name, title: 'Name', instruction: name_instruction})
  
  const description_instruction = 'Describe the listing'
  const description = isolate(Description)(sources, {...inputs, session$: inputs.session$, highlight_error$: show_errors$})
  const description_section: any = isolate(FocusWrapper)(sources, {component: description, title: 'Description', instruction: description_instruction})
  
  const event_types$ = inputs.session$
    .map(session => session.listing.meta.event_types)
    .publishReplay(1).refCount()

  const categories$ = inputs.session$
    .map(session => {
      return session.listing.meta.categories
    }).publishReplay(1).refCount()

  const event_types_and_categories_section = isolate(EventTypesAndCategories)(sources, {...inputs, categories$, event_types$,  session$: inputs.session$})

  const search_area_instruction = 'Select the city/region to use for the venue autocomplete'
  const search_area = isolate(SearchArea)(sources, {...inputs, session$: inputs.session$})
  const search_area_section: any = isolate(FocusWrapper)(sources, {component: search_area, title: 'Search area', instruction: search_area_instruction})

  const donde_instruction = 'Select the venue'
  const donde_invalid$ = show_errors$.startWith(false)
  const donde = isolate(Venue)(sources, {...inputs, session$: inputs.session$, search_area$: search_area_section.output$.pluck('data'), highlight_error$: donde_invalid$})
  const donde_section: any = isolate(FocusWrapper)(sources, {component: donde, title: 'Venue', instruction: donde_instruction})

  const listing_type_instruction = 'Does this listing represent a single (one-off) event or an event which recurs?'
  const listing_type = isolate(ListingType)(sources, {...inputs, session$: inputs.session$})
  const listing_type_section: any = isolate(FocusWrapper)(sources, {component: listing_type, title: 'Type', instruction: listing_type_instruction})

  const start_time_instruction = 'Set the start time of the event'
  const start_time = isolate(StartTime)(sources, {...inputs, session$: inputs.session$})
  const start_time_section: any = isolate(FocusWrapper)(sources, {component: start_time, title: 'Start time', instruction: start_time_instruction})

  const end_time_instruction = 'Set the end time of the event (optional)'
  const end_time = isolate(EndTime)(sources, {...inputs, session$: inputs.session$})
  const end_time_section: any = isolate(FocusWrapper)(sources, {component: end_time, title: 'End time', instruction: end_time_instruction})

  const door_time_section$ = event_types_and_categories_section.output$.map(output => output.data.event_types)
    .map((event_types: string[]) => {
      if (event_types.some(findEventTypeShow) || event_types.some(findEventTypeDance)) {
        const date_instruction = 'When do the doors open?'
        const door_time = isolate(DoorTime)(sources, {...inputs, session$: inputs.session$})
        const door_time_section: any = isolate(FocusWrapper)(sources, {component: door_time, title: 'Doors', instruction: date_instruction})
        return door_time_section
      } else {
        const door_time_section = UndefinedDoorTime(sources, inputs)
        return door_time_section
      }
    }).publishReplay(1).refCount()


  const door_time_section: any = componentify(door_time_section$, 'output$', 'focus$')

  const date_section$ = listing_type_section.output$.pluck('data')
    .map(type => {
      if (type === ListingTypes.SINGLE) {
        const date_instruction = 'Choose the event date'
        const single_date = isolate(SingleDate)(sources, {...inputs, session$: inputs.session$})
        const single_date_section: any = isolate(FocusWrapper)(sources, {component: single_date, title: 'Date', instruction: date_instruction})
        return single_date_section
      } else {
        const recurrence_instruction = 'Choose a rule for regular (weekly, monthly) events and/or select and exclude dates by clicking the calendar'
        const recurrence = isolate(Recurrence)(sources, {...inputs, session$: inputs.session$})
        const recurrence_section: any = isolate(FocusWrapper)(sources, {
          component: recurrence, 
          title: 'Recurrence dates', 
          instruction: recurrence_instruction, 
          skip_children: true
        })
        return recurrence_section
      }
    }).publishReplay(1).refCount()

  const date_section: any = componentify(date_section$, 'output$', 'focus$')

  const instruction_focus$ = O.merge(
    name_section.focus$, 
    description_section.focus$, 
    event_types_and_categories_section.focus$, 
    search_area_section.focus$,
    donde_section.focus$,
    listing_type_section.focus$,
    start_time_section.focus$,
    end_time_section.focus$,
    door_time_section.focus$,
    date_section.focus$,
    actions.main_panel_click$.mapTo(default_instruction).startWith(default_instruction)
  )

  const properties$ = O.combineLatest(
    name_section.output$,
    description_section.output$,
    event_types_and_categories_section.output$,
    search_area_section.output$,
    donde_section.output$,
    listing_type_section.output$,
    start_time_section.output$,
    end_time_section.output$,
    door_time_section.output$,
    date_section$.switchMap(x => x.output$)
  )
  
  const components = {
    name: name_section.DOM,
    description: description_section.DOM,
    event_types_and_categories: event_types_and_categories_section.DOM,
    search_area: search_area_section.DOM,
    donde: donde_section.DOM,
    listing_type: listing_type_section.DOM,
    start_time: start_time_section.DOM,
    end_time: end_time_section.DOM,
    door_time: door_time_section.DOM,
    date: date_section.DOM
  }

  const merged = mergeSinks(
    name_section, 
    description_section, 
    event_types_and_categories_section, 
    search_area_section,
    donde_section,
    listing_type_section,
    start_time_section,
    end_time_section,
    door_time_section,
    date_section
  )

  const state$ = model(actions, {...inputs, properties$, show_errors$})
  const vtree$ = view(state$, components)

  return {
    ...merged,
    DOM: vtree$,
    Router: O.merge(
      merged.Router,
      state$
        .distinctUntilChanged(
          (x: any, y: any) => {
            return x.session.properties.donde.modal === y.session.properties.donde.modal
          }
        )
        .withLatestFrom(sources.Router.history$, (state: any, route: any) => {
          return {
            pathname: route.pathname,
            type: 'push',
            state: deflateSession(state.session)
          }
        }).skip(1)
    ),
    output$: state$.map((state: any) => {
      return {
        session: state.session,
        valid: state.valid
      }
    }).publishReplay(1).refCount(),
    instruction_focus$ 
  }
}
