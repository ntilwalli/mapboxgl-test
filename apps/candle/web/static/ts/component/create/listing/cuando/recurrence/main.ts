import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import moment = require('moment')

function getStartMonth(cuando) {
  if (cuando && cuando.rrule && cuando.rrule.dtstart) {
    throw new Error(`Not yet supported`)
  } else {
    return moment()
  }
}

function intent(sources) {
  return {}
}

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.session$.switchMap(session => {
    const cuando = session.listing.cuando
    const init = {
      cuando: session.listing.cuando,
      currentMonth: moment(),
      startMonth: getStartMonth(cuando)
    }
  })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const state$ = model(actions, inputs)
  return {
    DOM: O.of(div([`recurrence input`])),
    output$: state$.pluck(`recurrence`)
  }
}