import {Observable as O} from 'rxjs'
import {div, span, input, textarea, h6} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks} from '../../../../../utils'
import moment = require('moment')
import {inflateDates} from '../../../../helpers/listing/utils'
import {getDatetimeFromObj,  to12HourTimeFromMoment} from '../../../../../helpers/time'

import BootstrapDateInput from '../../../../../library/bootstrapDateInput'
import BootstrapTimeInput from '../../../../../library/bootstrapTimeInputWithUndefined'

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .pluck(`state`)
    .pluck(`data`)
    .map(session => {

      session.listing.cuando = session.listing.cuando || {
        begins: undefined,
        ends: undefined
      }

      return session
    })
    .map(inflateDates)
    .publishReplay(1).refCount()

  return {
    session$
  }
}

function isValid(session) {
  return !!session.listing.cuando.begins
}

function reducers(actions, inputs) {
  const begins_date_r = inputs.begins_date$
    .map(x => {
      return x
    })
    //.skip(1)
    .map(date => state => {
      const begins_date = state.get(`begins_date`)
      //const new_date = (!begins_date || !begins_date.isSame(date, 'day')) ? date : undefined
      return state.set(`begins_date`, date).update(`session`, session => {
        const time = state.get(`begins_time`)
        if (date && time) {
          session.listing.cuando.begins = getDatetimeFromObj(date, time) 
        } else {
          session.listing.cuando.begins = undefined 
        }

        return session
      })
    })

  const begins_time_r = inputs.begins_time$
    //.skip(1)
    .map(time => state => {
      return state.set(`begins_time`, time).update(`session`, session => {
        const date = state.get(`begins_date`)
        if (date && time) {
          const ends = session.listing.cuando.ends
          const begins = getDatetimeFromObj(date, time)
          
          session.listing.cuando.begins = begins;

          if (ends && ends.isSameOrBefore(begins)) {
            session.listing.cuando.ends = ends.clone().add(1, 'day')
          } 
        } else {
          session.listing.cuando.begins = undefined 
        }

        return session
      })
    })

  const ends_time_r = inputs.ends_time$
    //.skip(1)
    .map(time => state => {
      return state.set(`ends_time`, time).update(`session`, session => {
        const date = state.get(`begins_date`)
        if (date && time) {
          const begins = session.listing.cuando.begins
          const ends = getDatetimeFromObj(date, time)

          if (begins && begins.isAfter(ends)) {
            session.listing.cuando.ends = getDatetimeFromObj(date.clone().add(1, 'day'), time)
          } else {
            session.listing.cuando.ends = ends
          } 
        } else {
          session.listing.cuando.ends = undefined 
        }

        return session
      })
    })

  return O.merge(begins_date_r, begins_time_r, ends_time_r)
}

function toMilitaryTime(t) {
  if (t) {
    return {
      hour: t.hour(),
      minute: t.minute()
    }
  } else {
    return t
  }
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$
    .switchMap((props: any) => {
      return reducer$
        .startWith(Immutable.Map(props))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .map((x: any) => ({
      ...x,
      valid: isValid(x.session)
    }))
    //.do(x => console.log(`single state`, x))
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({
      state$, 
      components: combineObj(components)
    })
    .map((info: any) => {
      const {state, components} = info
      const {begins_date, begins_time, ends_time} = components
      const {session, year, month} = state
      const {listing} = session
      const {cuando} = listing
      const {begins, ends} = cuando

      //console.log(`begins, ends`, begins, ends)
      const is_next_day = begins && ends && !begins.isSame(ends, 'day') ? true : false 
      //console.log(`next day?`, is_next_day)
      return div('.cuando-single', [
        div('.form-group', [
          h6('.d-flex', ['Date']),
          begins_date
        ]),
        div('.form-group', [
          h6('.d-flex', ['Start time']),
          begins_time
        ]),
        div('.form-group', [
          h6('.d-flex', ['End time']),
            is_next_day ? span(`.d-flex`, ['(following day)']) : null,
            ends_time
          ])
        ])
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const props$ = actions.session$.map(session => {
    const {listing} = session
    const {cuando} = listing
    const {begins, ends} = cuando
    const init = {
      session,
      begins_date: begins,
      begins_time: begins ? toMilitaryTime(begins) : undefined,
      ends_time: ends ? toMilitaryTime(ends) : undefined
    }

    return init
  }).publishReplay(1).refCount()

  const begins_date_input = isolate(BootstrapDateInput)(sources, {...inputs, props$: props$.pluck('begins_date')})
  const begins_time_input = isolate(BootstrapTimeInput)(sources, props$.pluck('begins_time'))
  const ends_time_input = isolate(BootstrapTimeInput)(sources, props$.pluck('ends_time'))

  const state$ = model(actions, {
    ...inputs, 
    props$, 
    begins_date$: begins_date_input.output$,
    begins_time$: begins_time_input.output$,
    ends_time$: ends_time_input.output$
  })

  const components = {
    begins_date: begins_date_input.DOM,
    begins_time: begins_time_input.DOM,
    ends_time: ends_time_input.DOM
  }

  const vtree$ = view(state$, components)

  const merged = mergeSinks(begins_date_input, begins_time_input, ends_time_input)
  return {
    ...merged,
    DOM: vtree$,
    output$: state$
  }
}
