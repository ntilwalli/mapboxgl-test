import {Observable as O} from 'rxjs'
import Cycle from '@cycle/rxjs-run'
import {makeDOMDriver} from '@cycle/dom'
import {RRule, RRuleSet, rrulestr} from 'rrule'

// const rule = new RRule({
//   freq: RRule.WEEKLY,
//   interval: 5,
//   byweekday: [RRule.MO, RRule.FR],
//   dtstart: new Date(2012, 1, 1, 10, 30),
//   until: new Date(2012, 12, 31)
// })

// // Get all occurrence dates (Date instances):
// console.log(rule.all())
// ['Fri Feb 03 2012 10:30:00 GMT+0100 (CET)',
//  'Mon Mar 05 2012 10:30:00 GMT+0100 (CET)',
//  'Fri Mar 09 2012 10:30:00 GMT+0100 (CET)',
//  'Mon Apr 09 2012 10:30:00 GMT+0200 (CEST)',
//  /* … */]

import component from './library/timeInput/main'
//import component from './library/dateInput/main'

function app(sources) {
  const out = component(
    sources, {
      props$: O.of({
        rangeStart: new Date()
      }), 
      rangeStart$: O.of(new Date()), 
      rangeEnd$: O.never()
    })
  out.result$.subscribe(x => console.log(x))
  return out
}

const {sinks, sources, run} = Cycle(app, {
  DOM: makeDOMDriver('#app-main')
})

run()
