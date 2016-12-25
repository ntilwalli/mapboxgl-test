import {Observable as O} from 'rxjs' 
import {div, span, input, h6, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, traceStartStop} from '../../../../../utils'
import moment = require('moment')
import {RRule} from 'rrule'
import {getActualRRule} from '../../../../helpers/listing/utils'
import {getDatetime} from '../../../../../helpers/time'
import clone = require('clone')
import deepEqual = require('deep-equal')
import {inflateDates} from '../../../../helpers/listing/utils'

import Calendar from './calendar/main'
import RRuleComponent from './rrule/advanced/main'
import TimeInput from '../../../../../library/timeInput/main'

import getModal from './getModal'

function getDuration(start_time, end_time) {
  const base = moment([2010, 1])
  const start = getDatetime(base.clone(), start_time)
  let end = getDatetime(base.clone(), end_time)
  
  if (end.isBefore(start)) {
    end = getDatetime(base.clone().add(1, 'day'), end_time)
  }

  return end.diff(start, 'minutes');
}

function syncStartTimeWithSession(start_time, session) {
  const {properties, listing} = session
  const {recurrence} = properties
  const {cuando} = listing

  properties.recurrence.start_time = start_time

  if (cuando.rrule) {
    properties.recurrence.rrule.dtstart = getDatetime(recurrence.rrule.dtstart, start_time)
    listing.cuando.rrule.dtstart = recurrence.rrule.dtstart.clone()

    if (cuando.rrule.until) {
      properties.recurrence.rrule.until = getDatetime(recurrence.rrule.until, start_time)
      listing.cuando.rrule.until = recurrence.rrule.until.clone()      
    }
  }

  if (cuando.rdate.length) {
    properties.recurrence.rdate = recurrence.rdate.map(x => getDatetime(x, start_time))
    listing.cuando.rdate = recurrence.rdate.map(x => getDatetime(x, start_time))
  }

  if (cuando.exdate.length) {
    properties.recurrence.rdate = recurrence.exdate.map(x => getDatetime(x, start_time))
    listing.cuando.exdate = recurrence.exdate.map(x => getDatetime(x, start_time))
  }

  if (recurrence.end_time) {
    listing.cuando.duration = getDuration(start_time, recurrence.end_time)
  }
}

function syncEndTimeWithSession(end_time, session) {
  const {properties, listing} = session
  const {recurrence} = properties
  const {cuando} = listing
  const {rrule, start_time, exdate, rdate} = recurrence

  properties.recurrence.end_time = end_time

  if (end_time) {
    if (start_time) {
      if (cuando.rrule || cuando.rdate.length) {
        listing.cuando.duration = getDuration(start_time, end_time)
      }
    }
  } else (
    listing.cuando.duration = undefined
  )
}

function syncRRuleWithSession(rrule, session) {
  if (rrule && ((rrule.freq === `weekly` && rrule.byweekday.length) || 
     (rrule.freq === `monthly` && rrule.byweekday.length && rrule.bysetpos.length))) {
    const {dtstart, until} = rrule
    const {start_time, end_time} = session.properties.recurrence

    session.properties.recurrence.rrule = clone(rrule)
    //console.log(`sent rrule`, rrule)
    const the_rrule = {
      ...rrule,
      dtstart: dtstart ? start_time ? getDatetime(dtstart, start_time) : dtstart.clone().startOf('day') : moment().startOf('day'),
      until: until ? until ? getDatetime(until, start_time) : until.clone().endOf('day') : undefined
    }

    session.listing.cuando.rrule = the_rrule
  } else {
    session.properties.recurrence.rrule = undefined
    session.listing.cuando.rrule = undefined
  }
}

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .pluck(`state`)
    .pluck(`data`)
    .map(session => {
      session.properties.recurrence = session.properties.recurrence || {
        type: undefined,
        data: undefined,
        rrule: undefined,
        start_time: undefined,
        end_time: undefined,
        rdate: [],
        exdate: []
      }

      session.listing.cuando = session.listing.cuando || {
        rrule: undefined,
        rdate: [],
        exdate: [],
        duration: undefined
      }

      return session
    })
    .map(inflateDates)
    .publishReplay(1).refCount()

  const change_start_time$ = DOM.select(`.appChangeStartTime`).events(`click`)
    .mapTo(`start_time`)
  const change_end_time$ = DOM.select(`.appChangeEndTime`).events(`click`)
    .mapTo(`end_time`)
  const rrule_expand$ = DOM.select(`.appRRuleSwitch`).events(`click`)


  const clear_start_time$ = DOM.select(`.appClearStartTime`).events(`click`)
    .mapTo(`start_time`)
  const clear_end_time$ = DOM.select(`.appClearEndTime`).events(`click`)
    .mapTo(`end_time`)

  return {
    session$,
    modal$: O.merge(change_start_time$, change_end_time$),
    clear_start_time$,
    clear_end_time$,
    rrule_expand$
  }
}

function toggleExDate(date, listing_exdate, properties_exdate, session) {
  const ex_index = session.listing.cuando.exdate.findIndex(x => x.isSame(date, `day`))
  if (ex_index >= 0) {
    session.properties.recurrence.exdate.splice(ex_index, 1)
    session.listing.cuando.exdate.splice(ex_index, 1)
  } else {
    session.properties.recurrence.exdate.push(date)
    session.listing.cuando.exdate.push(date)
  }
}

function toggleRDate(date, listing_rdate, properties_rdate, session) {
  const r_index = session.listing.cuando.rdate.findIndex(x => x.isSame(date, `day`))
  if (r_index >= 0) {
    session.properties.recurrence.rdate.splice(r_index, 1)
    session.listing.cuando.rdate.splice(r_index, 1)
  } else {
    session.properties.recurrence.rdate.push(date)
    session.listing.cuando.rdate.push(date)
  }
}

const isValid = session => {
  const {listing, properties} = session
  const {cuando} = listing
  const {start_time} = properties.recurrence
  return start_time && (cuando.rrule || cuando.rdate.length)
}

function reducers(actions, inputs) {

  const rrule_expand_r = actions.rrule_expand$.map(_ => state => {
    return state.update('rrule_expanded', x => !x)
  })

  const modal_r = actions.modal$.map(val => state => {
    return state.set(`modal`, val)
  })

  const modal_close_r = inputs.modal_close$.map(_ => state => {
    return state.set(`modal`, undefined)
  })

  const selected_r = inputs.selected$.map(date => state => {
    //console.log(`click`, date)
    return state.update(`session`, session => {
      const rrule = session.listing.cuando.rrule
      const recurrence = session.properties.recurrence
      const the_date = getDatetime(date, recurrence.start_time)

      if (rrule) {
        //console.log(`rrule + date`, rrule, the_date)
        const the_rule = getActualRRule(rrule)
        const start = the_date.clone().startOf('day').toDate()
        const end = the_date.clone().endOf('day').toDate()
        if (the_rule.between(start, end, true).length) {
          toggleExDate(the_date, session.listing.cuando.exdate, session.properties.recurrence.exdate, session)
        } else {
          toggleRDate(the_date, session.listing.cuando.rdate, session.properties.recurrence.rdate, session)
        }
      } else {
        //console.log(`date`, date)
        toggleRDate(the_date, session.listing.cuando.rdate, session.properties.recurrence.rdate, session)
      }

      //console.log(`session`, session)
      return session
    })
  })

  const rrule_r = inputs.rrule$.map(rrule => state => {
    return state.update('session', session => {
      syncRRuleWithSession(rrule, session)
      return session
    })
  })

  const modal_output_r = inputs.modal_output$.map(val => state => {
    //console.log(`modal output`, val)
    const modal = state.get(`modal`)
    return state.set(`modal`, undefined)
      .update(`session`, session => {
        switch (modal) {
          case 'start_time':
            syncStartTimeWithSession(val, session)
            break;
          case 'end_time':
            syncEndTimeWithSession(val, session)
            break;
          default:
            throw new Error(`Invalid modal type`)
        }

        return session
      })
  })

  const clear_start_time_r = actions.clear_start_time$.map(_ => state => {
    return state.update(`session`, session => {
      session.properties.recurrence.start_time = undefined
      return session
    })
  })

  const clear_end_time_r = actions.clear_end_time$.map(_ => state => {
    return state.update(`session`, session => {
      session.properties.recurrence.end_time = undefined
      return session
    })
  })

  return O.merge(
    rrule_expand_r, rrule_r,
    modal_r, modal_close_r, 
    selected_r, modal_output_r,
    clear_start_time_r, clear_end_time_r
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return actions.session$.switchMap(session => {
      return reducer$.startWith(Immutable.Map({
        session,
        modal: undefined,
        rrule_expanded: false
      })).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => clone(x.toJS()))
    .map(state => {
      return {
        ...state,
        valid: isValid(state.session)
      }
    })
    //.do(x => console.log(`rrule main state`, x))
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

function renderRRule(info) {
  const {state, components} = info
  const {rrule_component} = components
  const {session, rrule_expanded} = state
  const {properties, listing} = session
  const {cuando} = listing
  const {rrule} = cuando
  // const {recurrence} = properties
  // const {rrule, data, type} = recurrence

  let rrule_text = 'Not specified'
  if (rrule) {
    rrule_text  = getActualRRule(rrule).toText()
    rrule_text = rrule_text.substring(0, 1).toUpperCase() + rrule_text.substring(1)
  }

  const out = div('.row.mt-1', [
    div('.col-xs-12', [
      div('.row', [
        div('.col-xs-12.d-flex', [
          h6('.d-flex.fx-a-c.mr-1.mb-0', [`Rule`]),
          !rrule_expanded ? span('.d-flex.fx-a-c.mr-1', [!rrule ? `Not specified` : rrule_text]) : null,
          button(`.d-flex.fx-a-c.btn.btn-link.appRRuleSwitch`, [rrule_expanded ? 'collapse' : 'expand'])
        ])
      ]),
      div('.row', {style: {display: rrule_expanded ? "block" : "none"}}, [
        div('.col-xs-11.push-xs-1', [
          rrule_component
        ])
      ])
    ])
  ])

  return out
}

function renderTime(state) {
  //console.log(`state`, state)  
  const {session} = state
  const {properties} = session
  const {recurrence} = properties
  const {start_time, end_time} = recurrence

  return div(`.d-flex.fx-j-sa.mt-1`, [
    div(`.d-flex.fx-j-c`, [
      h6('.d-flex.fx-a-c.mb-0.mr-1', [
        `Start time`
      ]),
      div(`.d-flex.fx-j-c`, [
        span('.d-flex.fx-a-c.mr-1', [start_time ? getTimeString(start_time) : `Not specified`]),
        span(`.d-flex.fx-a-c.btn.btn-link.appChangeStartTime.fa.fa-pencil-square-o`, [])
      ])
    ]),
    div(`.d-flex.fx-j-c`, [
      h6('.d-flex.fx-a-c.mb-0.mr-1', [
        `End time`
      ]),
      div(`.d-flex.fx-j-c`, [
        span('.d-flex.fx-a-c.mr-1', [end_time ? getTimeString(end_time) : `Not specified`]),
        span(`.d-flex.fx-a-c.btn.btn-link.appChangeEndTime.fa.fa-pencil-square-o`, [])
      ])
    ])
  ])
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
      const {rrule, calendar, modal} = components
      return div(`.workflow-step.cuando-recurrence.mb-3`, [
        calendar,
        renderRRule(info),
        renderTime(state),
        modal
        //input(`.start-time-input`, {attrs: {type: `time`}}, [])
      ])
    })
}



export default function main(sources, inputs) {
  const actions = intent(sources)
  const selected$ = createProxy()
  const modal_output$ = createProxy()
  const modal_close$ = createProxy()
  const rrule$ = createProxy()


  const state$ = model(actions, {
    ...inputs, 
    rrule$,
    selected$,
    modal_output$,
    modal_close$
  })

  const modal$ = state$
    .distinctUntilChanged((x: any, y: any) => {
      return x.modal === y.modal
    })
    .map((state: any) => getModal(sources, inputs, state))
    .publishReplay(1).refCount()

  const modal = componentify(modal$)
  modal_close$.attach(modal$.switchMap(x => x.close$))
  modal_output$.attach(modal$.switchMap(x => x.done$))

  const calendar = Calendar(sources, {
    ...inputs, 
    props$: state$
      .map(state => state.session.listing.cuando)
      .distinctUntilChanged((x, y) => deepEqual(x, y))
  })

  const rrule_component = RRuleComponent(sources, {
    ...inputs, 
    props$: state$
      .map(state => state.session.listing.cuando.rrule)
      .distinctUntilChanged((x, y) => deepEqual(x, y))
  })

  selected$.attach(calendar.output$)
  //rrule$.attach(rrule_component.output$)
  
  const components = {
    calendar$: calendar.DOM,
    rrule_component$: rrule_component.DOM, 
    modal$: modal$.switchMap(x => x.DOM)
  }

  const vtree$ = view(state$, components)
  const merged = mergeSinks(calendar, rrule_component, modal)

  return {
    ...merged,
    DOM: vtree$,
    output$: state$
  }
}