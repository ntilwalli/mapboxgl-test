import {Observable as O} from 'rxjs'
import {div, span, input, textarea, label, h6, nav, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, targetIsOwner, processHTTP, toMessageBusMainError} from '../../../../utils'
import {
  ListingTypes, CategoryTypes, 
  EventTypeToProperties
} from '../../../../listingTypes'
import {clearAdminMessage, inflateSession, deflateSession, inflateListing, listingToSession, fromCheckbox, getDefaultSession, isUpdateDisabled, renderDisabledAlert, renderSuccessAlert} from '../../../helpers/listing/utils'
import clone = require('clone')
import moment = require('moment')

import FocusWrapper from '../focusWrapperWithInstruction'
import FocusCardWrapper from '../focusCardWrapper'
import Name from './name'
import Description from './description'
import EventTypesAndCategories from './eventTypesAndCategories'
import Venue from './donde/venue'
import SearchArea from './donde/searchArea'
import ListingType from './listingType'
import StartTime from './cuando/times/startTime'
import EndTime from './cuando/times/endTime'
import SingleDate from './cuando/date'
import Recurrence from './cuando/recurrence/main'

import UpdateListingQuery from '../../../../query/updateListing'

import {renderSKFadingCircle6} from '../../../../library/spinners'

const default_instruction = 'Click on a section to see tips'
function intent(sources) {
  const {DOM, Global, Router} = sources
  
  const main_panel_click$ = DOM.select('.appMainPanel').events('click').filter(targetIsOwner)
    .mapTo(default_instruction)

  const save$ = DOM.select('.appSaveButton').events('click').publish().refCount()

  return {
    main_panel_click$,
    save$
  }
}

function reducers(actions, inputs) {

  const waiting_r = inputs.waiting$.map(status => state => {
    return state.set('waiting', status)
  })

  const save_success_r = inputs.success$.map(status => state => state.set('save_status', status))

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

  const show_errors_r = actions.save$.map(val => state => {
    return state.set('show_errors', val)
  })

  return O.merge(properties_r, show_errors_r, save_success_r, waiting_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$ || O.of({})
  return combineObj({
      props$: inputs.props$,
      session$: inputs.session$,
    })
    .switchMap((info: any) => {
      //console.log('meta init', info)
      
      const session = info.session
      const init = {
        errors: [],
        show_errors: undefined,
        session,
        valid: false,
        waiting: false,
        save_status: undefined
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
  const {show_errors, errors, session} = state
  const {properties} = state.session
  const {admin} = properties
  const {message} = admin

  const {
    name, description, event_types_and_categories,
    search_area, donde, listing_type, start_time,
    end_time, date
  } = components

  const is_update_disabled = isUpdateDisabled(state.session)

  return div('.pt-4', {class: {"read-only": is_update_disabled}}, [
    message ? renderSuccessAlert(message) : null,
    show_errors && errors.length ? div(`.form-group`, [
      div(`.alerts-area`, errors.map(e => {
          return div(`.alert.alert-danger`, [
            e
          ])
      }))
    ]) : null,
    div({class: {"read-only": is_update_disabled ? false : true}}, [
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
    state.session.properties.donde.modal ? null : div('.mt-4', [   // Hack: We need to remove the anchor element if we cover it up to ensure the map gets rerendered...
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
    ])
  ])
}

function renderSaveButton(info) {
  const is_update_disabled = isUpdateDisabled(info.state.session)
  return button('.appSaveButton.mt-4.btn.btn-outline-success.d-flex.cursor-pointer.mt-4', {class: {"read-only": is_update_disabled || !info.state.valid}}, [
    span('.d-flex.align-items-center', ['Save changes']),
  ])
}

function view(state$, components) {
  return combineObj({
    state$: state$.map(x => {
      return x
    }),
    components$: combineObj(components).map(x => {
      return x
    })
  })
  .debounceTime(0)
  .map((info: any) => {
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
      renderDisabledAlert(state.session),
      renderMainPanel(info),
      renderSaveButton(info)
    ])
  })
}

function muxHTTP(sources) {
  return processHTTP(sources, 'updateListing')
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const show_error$ = actions.save$.mapTo(true).startWith(false)

  const name_instruction = 'Choose a name for the listing'
  const name = isolate(Name)(sources, {...inputs, session$: inputs.session$, highlight_error$: show_error$})
  const name_section: any = isolate(FocusWrapper)(sources, {component: name, title: 'Name', instruction: name_instruction})
  
  const description_instruction = 'Describe the listing'
  const description = isolate(Description)(sources, {...inputs, session$: inputs.session$, highlight_error$: show_error$})
  const description_section: any = isolate(FocusWrapper)(sources, {component: description, title: 'Description', instruction: description_instruction})
  
  const event_types_and_categories_section = isolate(EventTypesAndCategories)(sources, {...inputs, session$: inputs.session$})

  const search_area_instruction = 'Select the city/region to use for the venue autocomplete'
  const search_area = isolate(SearchArea)(sources, {...inputs, session$: inputs.session$})
  const search_area_section: any = isolate(FocusWrapper)(sources, {component: search_area, title: 'Search area', instruction: search_area_instruction})

  const donde_instruction = 'Select the venue'
  const donde_invalid$ = show_error$
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

  const date_section = componentify(date_section$)

  const instruction_focus$ = O.merge(
    name_section.focus$, 
    description_section.focus$, 
    event_types_and_categories_section.focus$, 
    search_area_section.focus$,
    donde_section.focus$,
    listing_type_section.focus$,
    start_time_section.focus$,
    end_time_section.focus$,
    date_section$.switchMap(x => x.focus$),
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
    date: date_section.DOM
  }




  const waiting$ = createProxy()
  const success$ = createProxy()
  const muxed_http = muxHTTP(sources)


  const state$ = model(actions, {...inputs, properties$, waiting$, success$})
  const save_attempt$ = actions.save$
    .withLatestFrom(state$, (_, state) => {
      return state
    })
    .filter((state: any) => state.valid)
    .map((state: any) => state.session.listing)

  const update_listing_query = UpdateListingQuery(sources, {props$: save_attempt$})

  const vtree$ = view(state$, components)
  
  waiting$.attach(update_listing_query.waiting$)
  //success$.attach(update_listing_query.success$)

  const merged = mergeSinks(
    name_section, 
    description_section, 
    event_types_and_categories_section, 
    search_area_section,
    donde_section,
    listing_type_section,
    start_time_section,
    end_time_section,
    date_section,
    update_listing_query
  )

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
          clearAdminMessage(state.session)

          return {
            pathname: route.pathname,
            type: 'push',
            state: deflateSession(state.session)
          }
        }).skip(1),
      update_listing_query.success$.withLatestFrom(state$, (listing_result, state: any) => {
        listing_result.listing = inflateListing(listing_result.listing)
        listing_result.session = listingToSession(listing_result.listing, state.session.properties.donde.search_area)
        listing_result.session.properties.admin.message = 'Changes saved successfully'
        const out = {
          pathname: sources.Router.createHref('/'),
          type: 'replace',
          state: listing_result
        }

        return out
      })
    ).publishReplay(1).refCount(),
    MessageBus: O.merge(
      merged.MessageBus,
      muxed_http.error$.map(status => {
        return {
          to: `main`, message: {
            type: `error`, 
            data: status
          }
        }
      }),
      update_listing_query.error$.map(toMessageBusMainError)
    ),
    output$: state$.map((state: any) => {
      return {
        session: state.session,
        valid: state.valid
      }
    }).publishReplay(1).refCount(),
    instruction_focus$,

  }
}
