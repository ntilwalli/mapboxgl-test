import {Observable as O} from 'rxjs' 
import {div, span, input} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy, traceStartStop} from '../../../../../utils'
import moment = require('moment')
import {RRule} from 'rrule'
import {getActualRRule} from '../../helpers'
import {getDatetime} from '../../../../../helpers/time'
import clone = require('clone')
import {inflateDates} from '../../helpers'

import Calendar from './calendar/main'
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
  const {dtstart, until} = rrule
  const {start_time, end_time} = session.properties.recurrence

  session.properties.recurrence.rrule = clone(rrule)
  
  if ((rrule.freq === `weekly` && rrule.byweekday.length) || 
      (rrule.freq === `monthly` && rrule.byweekday.length && rrule.bysetpos.length)) {
    //console.log(`sent rrule`, rrule)
    const the_rrule = {
      ...rrule,
      dtstart: dtstart ? start_time ? getDatetime(dtstart, start_time) : dtstart.clone().startOf('day') : moment().startOf('day'),
      until: until ? until ? getDatetime(until, start_time) : until.clone().endOf('day') : undefined
    }

    session.listing.cuando.rrule = the_rrule
  } else {
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
  const change_rrule_time$ = DOM.select(`.appChangeRRule`).events(`click`)
    .mapTo(`rrule`)


  const clear_start_time$ = DOM.select(`.appClearStartTime`).events(`click`)
    .mapTo(`start_time`)
  const clear_end_time$ = DOM.select(`.appClearEndTime`).events(`click`)
    .mapTo(`end_time`)

  return {
    session$,
    modal$: O.merge(change_start_time$, change_end_time$, change_rrule_time$),
    clear_start_time$,
    clear_end_time$
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
          case 'rrule':
            syncRRuleWithSession(val, session)
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
        modal: undefined
      })).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
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
  const {rrule_input} = components
  const {session} = state
  const {properties, listing} = session
  const {cuando} = listing
  const {rrule} = cuando
  // const {recurrence} = properties
  // const {rrule, data, type} = recurrence
  let out
  if (!rrule) {
    out = div(`.rrule-section`, [
      span(`.not-specified`, [
        span(`.sub-heading`, [`Rule`]),
        span([`Not specified`]),
        span(`.appChangeRRule.edit-button.fa.fa-pencil-square-o`, [])
      ])
    ])
  } else {
    const text = getActualRRule(rrule).toText()
    out = div(`.rrule-section`, [
      div(`.heading-section`, [
        span(`.heading`, [
          span(`.bold`, [`Rule`]), 
          span(`.appChangeRRule.edit-button.fa.fa-pencil-square-o`, [])
        ]),
      ]),
      div(`.value`, [
        text.substring(0, 1).toUpperCase() + text.substring(1)
      ])
    ])
  }

  return out
}

function renderTime(state) {
  //console.log(`state`, state)  
  const {session} = state
  const {properties} = session
  const {recurrence} = properties
  const {start_time, end_time} = recurrence

  return div(`.time-section`, [
    div(`.start-time`, [
      div(`.sub-heading`, [
        `Start time`
      ]),
      div(`.display`, [
        span(`.value`, [start_time ? getTimeString(start_time) : `Not specified`]),
        span(`.appChangeStartTime.edit-button.fa.fa-pencil-square-o`, [])
      ])
    ]),
    div(`.end-time`, [
      div(`.sub-heading`, [
        `End time`
      ]),
      div(`.display`, [
        span(`.value`, [end_time ? getTimeString(end_time) : `Not specified`]),
        span(`.appChangeEndTime.edit-button.fa.fa-pencil-square-o`, [])
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
      return div(`.workflow-step.recurrence`, [
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

  const state$ = model(actions, {
    ...inputs, 
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

  modal_close$.attach(modal$.switchMap(x => x.close$))
  modal_output$.attach(modal$.switchMap(x => x.done$))

  const calendar = Calendar(sources, {
    ...inputs, 
    // props$: O.of({
    //   rdate: [],
    //   exdate: [],
    //   rrule: undefined
    // })
    props$: state$
      .map(state => state.session.listing.cuando)
  })

  selected$.attach(calendar.output$)
  
  const components = {
    calendar$: calendar.DOM,
    modal$: modal$.switchMap(x => x.DOM)
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$
  }
}