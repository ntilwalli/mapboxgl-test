import {Observable as O} from 'rxjs' 
import {div, span, input, h6, button, label} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, componentify, traceStartStop} from '../../../../../utils'
import moment = require('moment')
import {getActualRRule} from '../../../../helpers/listing/utils'
import {getDatetime} from '../../../../../helpers/time'
import clone = require('clone')
import deepEqual = require('deep-equal')
import {inflateDates} from '../../../../helpers/listing/utils'

import Calendar from './calendar/main'
import RRuleComponent from './rrule/advanced/main'
import TimeInput from '../../../../../library/bootstrapTimeInputWithUndefined'
import DateInput from '../../../../../library/bootstrapDateInput'
import getModal from './getModal'
import {RRule} from 'rrule'
import Collection from './collection/main'
import {default as Rule, getDefault as getRuleDefault} from './rule/main'

function getDuration(start_time, end_time) {
  const base = moment([2010, 1])
  const start = getDatetime(base.clone(), start_time)
  let end = getDatetime(base.clone(), end_time)
  
  if (end.isBefore(start)) {
    end = getDatetime(base.clone().add(1, 'day'), end_time)
  }

  return end.diff(start, 'minutes');
}

function syncStartDateWithSession(start_date, session) {

}

function syncEndDateWithSession(start_date, session) {
  
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
  const {rrules, start_time, exdate, rdate} = recurrence

  properties.recurrence.end_time = end_time

  if (end_time) {
    if (start_time) {
      if (cuando.rrules.length || cuando.rdate.length) {
        listing.cuando.duration = getDuration(start_time, end_time)
      }
    }
  } else (
    listing.cuando.duration = undefined
  )
}

function syncRRuleWithSession(rrule, session) {
  if (rrule && (rrule.dtstart && (rrule.freq === `weekly` && rrule.byweekday.length) || 
     (rrule.freq === `monthly` && rrule.byweekday.length && rrule.bysetpos.length))) {
    const {dtstart, until} = rrule
    const {start_time, end_time} = session.properties.recurrence

    session.properties.recurrence.rrule = rrule
    //console.log(`sent rrule`, rrule)
    const the_rrule = {
      ...rrule,
      dtstart: start_time ? getDatetime(dtstart, start_time) : dtstart.clone().startOf('day'),
      until: until ? start_time ? getDatetime(until, start_time) : until.clone().endOf('day') : undefined
    }

    session.listing.cuando.rrule = the_rrule
  } else {
    session.properties.recurrence.rrule = rrule
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
        rrules: [],
        start_time: undefined,
        end_time: undefined,
        rdate: [],
        exdate: []
      }

      session.listing.cuando = session.listing.cuando || {
        rrules: [],
        rdate: [],
        exdate: [],
        duration: undefined
      }

      return session
    })
    .map(inflateDates)
    .publishReplay(1).refCount()



  return {
    session$
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

  const rules_r = inputs.rules$.map(rules => state => {
    return state
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

  // const rrule_r = inputs.rrule$.map(rrule => state => {
  //   return state.update('session', session => {
  //     syncRRuleWithSession(rrule, session)
  //     return session
  //   })
  // })

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


  // const modal_output_r = inputs.modal_output$.map(val => state => {
  //   //console.log(`modal output`, val)
  //   const modal = state.get(`modal`)
  //   return state.set(`modal`, undefined)
  //     .update(`session`, session => {
  //       switch (modal) {
  //         case 'start_time':
  //           syncStartTimeWithSession(val, session)
  //           break;
  //         case 'end_time':
  //           syncEndTimeWithSession(val, session)
  //           break;
  //         default:
  //           throw new Error(`Invalid modal type`)
  //       }

  //       return session
  //     })
  // })

  // const clear_start_time_r = actions.clear_start_time$.map(_ => state => {
  //   return state.update(`session`, session => {
  //     session.properties.recurrence.start_time = undefined
  //     return session
  //   })
  // })

  // const clear_end_time_r = actions.clear_end_time$.map(_ => state => {
  //   return state.update(`session`, session => {
  //     session.properties.recurrence.end_time = undefined
  //     return session
  //   })
  // })

  return O.merge(
    rules_r, 
    selected_r
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
      const {start_time, end_time, calendar, rules_component} = components

      return div(`.cuando-recurrence`, [
        //div('.form-group', [
          //h6('.d-flex.fx-j-c', ['Start time']),
          rules_component,
        //]),
        calendar,
        div('.row.mt-1', [
          div('.col-xs-3.d-flex.fx-a-c', [
            h6('.d-flex.fx-a-c.mb-0', ['Start time']),
          ]),
          div('.col-xs-9.d-flex.fx-a-c', [
            start_time
          ])
        ]),
        div('.row.mt-1', [
          div('.col-xs-3.d-flex.fx-a-c', [
            h6('.d-flex.fx-a-c.mb-0', ['End time']),
          ]),
          div('.col-xs-9.d-flex.fx-a-c', [
            end_time
          ])
        ])
      ])
    })
}

// function areRRulesMergeable()

// function toRRuleArray(rrule) {
//   return [{

//   }]
// }

function fromRRuleArray(arr) {
  if (arr.length) {
    return {
      freq: "weekly",
      byweekday: ["monday"],
      interval: 1
    }
  }
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const selected$ = createProxy()
  const start_date = isolate(DateInput)(sources, {...inputs, props$: actions.session$.map(session => session.properties.recurrence.start_date)})
  const end_date = isolate(DateInput)(sources, {...inputs, props$: actions.session$.map(session => session.properties.recurrence.end_date)})


  const start_time = isolate(TimeInput)(sources, actions.session$.map(session => session.properties.recurrence.start_time))
  const end_time = isolate(TimeInput)(sources, actions.session$.map(session => session.properties.recurrence.end_time))

  const rules_component: any = isolate(Collection)(sources, {
    ...inputs, 
    props$: actions.session$.map(session => {
      return []//toRRuleArray(session.listing.cuando.rrule)
    }),
    item: Rule, 
    item_heading: 'rule',
    component_id: 'Rules', 
    itemDefault: getRuleDefault,
    initDefault: getRuleDefault
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
        return state.session.listing.cuando
      })
      // .distinctUntilChanged((x, y) => {
      //   return deepEqual(x, y)
      // })
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