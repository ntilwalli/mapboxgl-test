import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM} from '../../../../../utils'

import DoneModal from '../../../../../library/doneModal'

import TimeInput from '../../../../../library/timeInput/main'
//import RRuleInput from './rrule/main'
import AdvancedRRule from './rrule/advanced/main'
//(sources, {...inputs, props$: O.of(rrule).publishReplay(1).refCount()})

export default function main(sources, inputs, {modal, session}) {
  if (modal === `start_time`) {
    const out=  DoneModal(sources, {
      ...inputs,
      content: (sources, inputs) => TimeInput(sources, inputs),
      props$: O.of({title: `Change Start Time`}),
      initialState$: O.of(session.properties.recurrence.start_time).publishReplay(1).refCount()
    })

    return out
  } else if (modal === `end_time`) {
    const out = DoneModal(sources, {
      ...inputs,
      content: (sources, inputs) => TimeInput(sources, inputs),
      props$: O.of({title: `Change End Time`}),
      initialState$: O.of(session.properties.recurrence.end_time).publishReplay(1).refCount()
    })
    return out
  } else if (modal === `rrule`) {
    //console.log(`get modal rrule: `, session)
    const out = DoneModal(sources, {
      ...inputs,
      content: (sources, inputs) => AdvancedRRule(sources, inputs),
      props$: O.of({title: `Change Rule`, styleClass: `.rrule-modal`}),
      initialState$: O.of(session.properties.recurrence.rrule).map(x => {
        return x || {
          freq: undefined,
          byweekday: [],
          interval: undefined,
          bysetpos: [],
          dtstart: undefined,
          until: undefined
        }
      }).publishReplay(1).refCount()
    })
    return out
  } else {
    const out = blankComponentUndefinedDOM()
    return {
      ...out,
      done$: O.never(),
      close$: O.never(),
      output$: O.never()
    }
  }
}