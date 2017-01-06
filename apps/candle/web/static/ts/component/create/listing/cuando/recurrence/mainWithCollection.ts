import {Observable as O} from 'rxjs' 
import {div, em, span, input, h6, button, label} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, traceStartStop} from '../../../../../utils'
import moment = require('moment')
import {getActualRRule} from '../../../../helpers/listing/utils'
import {getDatetimeFromObj} from '../../../../../helpers/time'
import clone = require('clone')
import deepEqual = require('deep-equal')
import {inflateSession, fromRule, toRule, normalizeRule} from '../../../../helpers/listing/utils'

import Calendar from './calendar/main'
import RRuleComponent from './rrule/advanced/main'
import TimeInput from '../../../../../library/bootstrapTimeInputWithUndefined'
import DateInput from '../../../../../library/bootstrapDateInput'
import getModal from './getModal'
import {RRule} from 'rrule'
import Collection from './collection/main'
import {default as Rule, getDefault as getRuleDefault} from './rule/main'
import {DayOfWeek, RecurrenceFrequency} from '../../../../../listingTypes'

function getDuration(start_time, end_time) {
  const base = moment([2010, 1])
  const start = getDatetimeFromObj(base.clone(), start_time)
  let end = getDatetimeFromObj(base.clone(), end_time)
  
  if (end.isBefore(start)) {
    end = getDatetimeFromObj(base.clone().add(1, 'day'), end_time)
  }

  return end.diff(start, 'minutes');
}

function syncCuando(session) {
  const {properties, listing} = session
  const {recurrence} = properties
  const {start_date, end_date, start_time, end_time, rules, rdates, exdates} = recurrence
  const {cuando} = listing

  if (rules.length && start_time) {
    cuando.rrules = rules.map(fromRule).map(rule => {
      const n_rule = normalizeRule(rule, start_date, end_date, start_time)
      return n_rule
    })
  } else {
    cuando.rrules = []
  }

  if (rdates.length && start_time) {
    cuando.rdates = rdates.map(rdate => getDatetimeFromObj(rdate, start_time))
  } else {
    cuando.rdates = []
  }

  if (exdates.length && start_time) {
    cuando.exdates = exdates.map(exdate => getDatetimeFromObj(exdate, start_time))
  } else {
    cuando.exdates = []
  }

  if (start_time && end_time) {
    cuando.duration = getDuration(start_time, end_time)
  }
}

// rrules[*].dtstart = start_date (w default) + start_time + rrules.length
// rrules[*].until = end_date + start_time + rrules.length
// rdates[*] = start_time + rdates.length
// exdates[*] = start_time + exdates.length


function syncStartDateWithSession(start_date, session) {
  session.properties.recurrence.start_date = start_date
  syncCuando(session)
}

function syncEndDateWithSession(end_date, session) {
  session.properties.recurrence.end_date = end_date
  syncCuando(session)
}

function syncStartTimeWithSession(start_time, session) {
  session.properties.recurrence.start_time = start_time
  syncCuando(session)
}

function syncEndTimeWithSession(end_time, session) {
  session.properties.recurrence.end_time = end_time
  syncCuando(session)
}

function syncRulesWithSession(rules, session) {
  session.properties.recurrence.rules = rules
  syncCuando(session)
}

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .pluck(`state`)
    .pluck(`data`)
    .map(session => {
      session.properties.recurrence = session.properties.recurrence || {
        //structured_rules: undefined,
        rules: [],
        start_time: undefined,
        end_time: undefined,
        start_date: undefined, 
        end_date: undefined,
        rdates: [],
        exdates: []
      }

      session.listing.cuando = session.listing.cuando || {
        rrules: [],
        rdates: [],
        exdates: [],
        duration: undefined
      }

      return session
    })
    .map(inflateSession)
    .publishReplay(1).refCount()

  return {
    session$
  }
}

function toggleExDate(date, session) {
  const ex_index = session.properties.recurrence.exdates.findIndex(x => x.isSame(date, `day`))
  if (ex_index >= 0) {
    session.properties.recurrence.exdates.splice(ex_index, 1)
  } else {
    session.properties.recurrence.exdates.push(date)
  }

  syncCuando(session)
}

function toggleRDate(date, session) {
  const r_index = session.properties.recurrence.rdates.findIndex(x => x.isSame(date, `day`))
  if (r_index >= 0) {
    session.properties.recurrence.rdates.splice(r_index, 1)
  } else {
    session.properties.recurrence.rdates.push(date)
  }

  syncCuando(session)
}

const isValid = session => {
  const {listing, properties} = session
  const {cuando} = listing
  const {start_time} = properties.recurrence
  return start_time && (cuando.rrules.length || cuando.rdates.length)
}

function rulesIncludeDate(session, date) {
  const {properties} = session
  const {recurrence} = properties
  const {rules, start_date, end_date, start_time} = recurrence
  return rules.map(fromRule).some(rule => {
    const n_rule = normalizeRule(rule, start_date, end_date, start_time)
    const start = date.clone().startOf('day')
    const end = date.clone().endOf('day')
    const dates = getActualRRule(n_rule).between(start, end, true)
    return dates.length
  })
}

function reducers(actions, inputs) {

  const rules_r = inputs.rules$.map(rules => state => {
    return state.update('session', session => {
      //session.properties.recurrence.structured_rules = rules
      syncRulesWithSession(rules.valid ? rules.data : [], session)
      return session
    })
  })

  const selected_r = inputs.selected$.map(date => state => {
    return state.update(`session`, session => {
      const rules = session.properties.recurrence.rules
      const start_time = session.properties.recurrence.start_time
      const the_date = getDatetimeFromObj(date, start_time)
      if (rules.length > 0) {
        if (rulesIncludeDate(session, date)) {
          toggleExDate(the_date, session)
        } else {
          toggleRDate(the_date, session)
        }
      } else {
        toggleRDate(the_date, session)
      }

      return session
    })
  })

  const start_time_r = inputs.start_time$.map(val => state => {
    return state.update('session', session => {
      syncStartTimeWithSession(val, session)
      return session
    })
  })

  const end_time_r = inputs.end_time$.map(val => state => {
    return state.update('session', session => {
      syncEndTimeWithSession(val, session)
      return session
    })
  })

  const start_date_r = inputs.start_date$.map(val => state => {
    return state.update('session', session => {
      syncStartDateWithSession(val, session)
      return session
    })
  })

  const end_date_r = inputs.end_date$.map(val => state => {
    return state.update('session', session => {
      syncEndDateWithSession(val, session)
      return session
    })
  })

  return O.merge(
    rules_r, 
    selected_r,
    start_time_r,
    end_time_r,
    start_date_r,
    end_date_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return actions.session$.switchMap(session => {
      return reducer$.startWith(Immutable.Map({
        session
      })).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .map(state => {
      return {
        ...state,
        valid: isValid(state.session)
      }
    })
    .do(x => console.log(`rrule main state`, x))
    .publishReplay(1).refCount()
}

function getTimeString(time) {
  //console.log(`time`, time)
  const {hour, minute, mode} = time
  let military_hour = hour
  if (mode === `AM`) {
    if (hour === 12) {
      military_hour = 0
    }
  } else {
    if (hour < 12) {
      military_hour = hour + 12
    }
  }
  
  return moment([2010, 1, 1, military_hour, minute]).format('h:mm A')
}

function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    })
    .debounceTime(0)
    .map((info: any) => {
      //console.log(`info`, info)
      const {state, components} = info
      const {session} = state
      const {properties, listing} = session
      const {recurrence} = properties
      const {rules} = recurrence
      const {cuando} = listing
      const {rrules} = cuando
      const {start_time, end_time, calendar, rules_component, start_date, end_date} = components

      return div(`.cuando-recurrence`, [
        span('.form-group', ['Recurring events will cause listings to be automatically generated and staged, allowing you to post when you\'re ready.  Add rules for simple recurrences, and/or add dates directly by clicking unselected boxes in the calendar below.  Exclude dates by clicking selected boxes.']),
        div([rules_component]),
        rules.length > 0 ? div('.mt-xs', [
          div([
            em('.d-flex.mb-xs', ['Beginning']),
            start_date
          ]),
          div('.mt-xs', [
            em('.d-flex.mb-xs', ['Ending']),
            end_date
          ])
        ]) : null,
        div('.mt-1.mb-xs', [
          h6('.d-flex.mb-xs', ['Start time (required)']),
          start_time
        ]),
        div('.mb-xs', [
          h6('.d-flex.mb-xs', ['End time']),
          end_time
        ]),
        calendar
      ])
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const selected$ = createProxy()
  const start_date = isolate(DateInput)(sources, {
    ...inputs, 
    props$: actions.session$
      .map(session => session.properties.recurrence.start_date || moment().startOf('day'))
  })
  const end_date = isolate(DateInput)(sources, {
    ...inputs, 
    props$: actions.session$.map(session => session.properties.recurrence.end_date)
  })


  const start_time = isolate(TimeInput)(sources, actions.session$.map(session => session.properties.recurrence.start_time))
  const end_time = isolate(TimeInput)(sources, actions.session$.map(session => session.properties.recurrence.end_time))

  const rules_component: any = isolate(Collection)(sources, {
    ...inputs, 
    props$: actions.session$.map(session => {
      return session.properties.recurrence.rules
    }),
    item: Rule, 
    item_heading: 'rule',
    component_id: 'Rules', 
    itemDefault: getRuleDefault
  })

  const state$ = model(actions, {
    ...inputs, 
    rules$: rules_component.output$,
    selected$,
    start_time$: start_time.output$,
    end_time$: end_time.output$,
    start_date$: start_date.output$,
    end_date$: end_date.output$
  })

  const calendar = Calendar(sources, {
    ...inputs, 
    props$: state$
      .map(state => {
        return state.session.properties.recurrence
      })
  })

  selected$.attach(calendar.output$)

  const components = {
    rules_component$: rules_component.DOM,
    start_date$: start_date.DOM, 
    end_date$: end_date.DOM,
    start_time$: start_time.DOM,
    end_time$: end_time.DOM,
    calendar$: calendar.DOM
  }

  const vtree$ = view(state$, components)
  const merged = mergeSinks(rules_component, calendar, start_date, end_date, start_time, end_time)

  return {
    ...merged,
    DOM: vtree$,
    output$: state$
  }
}