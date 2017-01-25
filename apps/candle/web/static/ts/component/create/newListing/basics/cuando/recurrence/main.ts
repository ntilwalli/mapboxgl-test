import {Observable as O} from 'rxjs' 
import {div, em, span, input, h6, button, label} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, traceStartStop} from '../../../../../../utils'
import moment = require('moment')
import {getActualRRule} from '../../../../../helpers/listing/utils'
import {getDatetimeFromObj} from '../../../../../../helpers/time'
import clone = require('clone')
import deepEqual = require('deep-equal')
import {inflateSession, fromRule, toRule, normalizeRule} from '../../../../../helpers/listing/utils'

import Calendar from './calendar/main'
import TimeInput from '../../../../../../library/bootstrapTimeInputWithUndefined'
import DateInput from '../../../../../../library/bootstrapDateInput'
import {RRule} from 'rrule'
import Collection from './collection/main'
import {default as Rule, getDefault as getRuleDefault} from './rule/main'
import {DayOfWeek, RecurrenceFrequency} from '../../../../../../listingTypes'

import FocusWrapper from '../../../focusWrapperWithInstruction'
import {applyRecurringCuando} from '../helpers'

function getDuration(start_time, end_time) {
  const base = moment([2010, 1])
  const start = getDatetimeFromObj(base.clone(), start_time)
  let end = getDatetimeFromObj(base.clone(), end_time)
  
  if (end.isBefore(start)) {
    end = getDatetimeFromObj(base.clone().add(1, 'day'), end_time)
  }

  return end.diff(start, 'minutes');
}


// rrules[*].dtstart = start_date (w default) + start_time + rrules.length
// rrules[*].until = end_date + start_time + rrules.length
// rdates[*] = start_time + rdates.length
// exdates[*] = start_time + exdates.length



function syncRulesWithSession(rules, recurrence) {
  recurrence.rules = rules
}

function toggleExDate(date, recurrence) {
  const ex_index = recurrence.exdates.findIndex(x => x.isSame(date, `day`))
  if (ex_index >= 0) {
    recurrence.exdates.splice(ex_index, 1)
  } else {
    recurrence.exdates.push(date)
  }
}

function toggleRDate(date, recurrence) {
  const r_index = recurrence.rdates.findIndex(x => x.isSame(date, `day`))
  if (r_index >= 0) {
    recurrence.rdates.splice(r_index, 1)
  } else {
    recurrence.rdates.push(date)
  }
}

function rulesIncludeDate(recurrence, date) {
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
    return state.set('rules', Immutable.fromJS(rules.valid ? rules.data : []))
  })

  const selected_r = inputs.selected$.map(date => state => {
    const recurrence = state.toJS()
    const rules = recurrence.rules
    const start_time = recurrence.start_time
    const the_date = getDatetimeFromObj(date, start_time)
    if (rules.length > 0) {
      if (rulesIncludeDate(recurrence, date)) {
        toggleExDate(the_date, recurrence)
      } else {
        toggleRDate(the_date, recurrence)
      }
    } else {
      toggleRDate(the_date, recurrence)
    }

    return Immutable.fromJS(recurrence)
  })


  const start_date_r = inputs.start_date$.map(val => state => {
    return state.set('start_date', val)
  })

  const end_date_r = inputs.end_date$.map(val => state => {
    return state.set('end_date', val)
  })

  return O.merge(
    rules_r, 
    selected_r,
    start_date_r,
    end_date_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.session$.switchMap(session => {
      return reducer$
        .startWith(Immutable.fromJS(session.properties.cuando.recurrence))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
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
      const {rules} = state
      const {calendar, rules_component, start_date, end_date} = components

      return div(`.cuando-recurrence`, [
        span('.form-group', [
          'Recurring events will cause listings to be automatically generated and staged, allowing you to post when you\'re ready.  Add rules for simple recurrences, and/or add dates directly by clicking unselected boxes in the calendar below.  Exclude dates by clicking selected boxes.'
        ]),
        div([rules_component]),
        rules.length > 0 ? div('.mt-xs', [
          div('.mt-2', [
            start_date
          ]),
          div('.mt-2', [
            end_date
          ])
        ]) : null,
        div('.mt-4', [
          calendar
        ])
      ])
    })
}

function applyChange(session, val) {
  session.properties.cuando.recurrence = val
  applyRecurringCuando(session)
}

export default function main(sources, inputs) {
  const actions = {}
  const selected$ = createProxy()
  const start_date = isolate(DateInput)(sources, {
    ...inputs, 
    props$: inputs.session$
      .map(session => {
        return session.properties.cuando.recurrence.start_date || moment().startOf('day')
      })
  })

  const begins_instruction = "When does this recurring listing begin?"
  const start_date_section: any = isolate(FocusWrapper)(sources, {component: start_date, title: 'Begins', instruction: begins_instruction})

  const end_date = isolate(DateInput)(sources, {
    ...inputs, 
    props$: inputs.session$.map(session => {
      return session.properties.cuando.recurrence.end_date
    })
  })

  const ends_instruction = "When does this recurring listing end? (Optional)"
  const end_date_section: any = isolate(FocusWrapper)(sources, {component: end_date, title: 'Ends', instruction: ends_instruction})

  const rules: any = isolate(Collection)(sources, {
    ...inputs, 
    props$: inputs.session$.map(session => {
      return session.properties.cuando.recurrence.rules
    }),
    item: Rule, 
    item_heading: 'rule',
    component_id: 'Rules', 
    itemDefault: getRuleDefault
  })

  const rules_instruction = "Each rule defines a recurrence, e.g. weekly Mondays, or 3rd Tuesday of each month"
  const rules_section: any = isolate(FocusWrapper)(sources, {component: rules, instruction: rules_instruction})

  const state$ = model(actions, {
    ...inputs, 
    rules$: rules_section.output$,
    selected$,
    start_date$: start_date.output$,
    end_date$: end_date_section.output$
  })

  const calendar = isolate(Calendar)(sources, {
    ...inputs, 
    props$: state$
  })

  const calendar_instruction = "Interactive calendar displaying the selected dates for this recurring listing"
  const calendar_section: any = isolate(FocusWrapper)(sources, {component: calendar, title: 'Recurrence calendar', instruction: calendar_instruction})

  selected$.attach(calendar_section.output$)

  const components = {
    rules_component$: rules_section.DOM,
    start_date$: start_date_section.DOM, 
    end_date$: end_date_section.DOM,
    calendar$: calendar_section.DOM
  }

  const vtree$ = view(state$, components)
  const merged = mergeSinks(rules_section, calendar_section, start_date_section, end_date_section)
  const focus$ = O.merge(rules_section.focus$, calendar_section.focus$, start_date_section.focus$, end_date_section.focus$)

  return {
    ...merged,
    DOM: vtree$,
    focus$,
    output$: state$.map(state => {
      return {
        data: state,
        apply: applyChange,
        errors: [],
        valid: true
      }
    })
  }
}