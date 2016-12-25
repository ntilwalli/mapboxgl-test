import {Observable as O} from 'rxjs'
import {div, span, input, textarea, h6} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy} from '../../../../../utils'
import moment = require('moment')
import {inflateDates} from '../../../../helpers/listing/utils'
import {getDatetime, to12HourTimeFromMoment} from '../../../../../helpers/time'

import SmartMonthCalendar from '../../../../../library/smartMonthCalendar'
import TimeInput from '../../../../../library/timeInput/main'

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
 
  const change_month$ = O.merge(
      DOM.select(`.appIncMonth`).events(`click`).mapTo(1),
      DOM.select(`.appDecMonth`).events(`click`).mapTo(-1)
    )


  return {
    session$,
    change_month$
  }
}

function isValid(session) {
  return !!session.listing.cuando.begins
}

function reducers(actions, inputs) {

  const change_month_r = actions.change_month$.map(inc => state => {
    let month = state.get(`month`)
    let year = state.get(`year`)

    if (inc > 0) {
      month = month + inc
      if (month > 11) {
        month = month % 12
        year++
      }

    } else {
      month = month + inc
      if (month < 0) {
        month = month + 12
        year--
      }
    }

    return state.set(`month`, month).set(`year`, year)
  })

  const begins_date_r = inputs.begins_date$.map(date => state => {
    const begins_date = state.get(`begins_date`)
    const new_date = (!begins_date || !begins_date.isSame(date, 'day')) ? date : undefined
    return state.set(`begins_date`, new_date).update(`session`, session => {
      const time = state.get(`begins_time`)
      if (new_date && time) {
        session.listing.cuando.begins = getDatetime(new_date, time) 
      } else {
        session.listing.cuando.begins = undefined 
      }

      return session
    })
  })

  const begins_time_r = inputs.begins_time$.map(time => state => {
    return state.set(`begins_time`, time).update(`session`, session => {
      const date = state.get(`begins_date`)
      if (date && time) {
        const ends = session.listing.cuando.ends
        const begins = getDatetime(date, time)
        
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

  const ends_time_r = inputs.ends_time$.map(time => state => {
    return state.set(`ends_time`, time).update(`session`, session => {
      const date = state.get(`begins_date`)
      if (date && time) {
        const begins = session.listing.cuando.begins
        const ends = getDatetime(date, time)

        if (begins && begins.isAfter(ends)) {
          session.listing.cuando.ends = getDatetime(date.clone().add(1, 'day'), time)
        } else {
          session.listing.cuando.ends = ends
        } 
      } else {
        session.listing.cuando.ends = undefined 
      }

      return session
    })
  })

  return O.merge(begins_date_r, begins_time_r, ends_time_r, change_month_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1)
    })
    .switchMap((info: any) => {
      const session = info.session
      const {listing} = session
      const {cuando} = listing
      const {begins, ends} = cuando
      const init = {
        session,
        month: begins ? begins.month() : moment().month(),
        year: begins ? begins.year() : moment().year(),
        begins_date: begins,
        begins_time: begins ? to12HourTimeFromMoment(begins) : undefined,
        ends_time: ends ? to12HourTimeFromMoment(ends) : undefined
      }

      return reducer$
        .startWith(Immutable.Map(init))
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
          div('.row', [
            div('.col-xs-6.push-xs-3', {style: {display: "flex", "justify-content": "center"}}, [
              span(`.calendar`, [
                div(`.calendar-controller`, [
                  div(`.appDecMonth.text-button.fa.fa-angle-left.fa-2x`, []),
                  div(`.flex-center`, [moment([year, month]).format('MMM YYYY')]),
                  div(`.appIncMonth.text-button.fa.fa-angle-right.fa-2x`, []) 
                ]),
                begins_date
              ]),
            ])
          ])
        ]),
        div('.form-group', [
          h6('.d-flex.fx-j-c', ['Start time']),
          begins_time
        ]),
        div('.form-group', [
          h6('.d-flex.fx-j-c', ['End time']),
            is_next_day ? span(`.d-flex.fx-j-c`, ['(following day)']) : null,
            ends_time
          ])
        ])
    })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const begins_date$ = createProxy()
  const begins_time$ = createProxy()
  const ends_date$ = createProxy()
  const ends_time$ = createProxy()
  const state$ = model(actions, {
    ...inputs, 
    begins_date$,
    begins_time$,
    //ends_date$,
    ends_time$
  })

  const begins_date_input = SmartMonthCalendar(
    sources, {
      ...inputs, 
      props$: state$.map((state: any) => ({
        year: state.year, 
        month: state.month, 
        selected: state.begins_date ? [state.begins_date] : []
      }))
    })

  const begins_time_input = isolate(TimeInput)(
    sources, {
      ...inputs,
      props$: state$.take(1).map((state: any) => state.begins_time)
    }
  )

  // const ends_date_input = SmartMonthCalendar(
  //   sources, {
  //     ...inputs, 
  //     props$: state$.map((state: any) => ({
  //       year: state.ends_year, 
  //       month: state.ends_month, 
  //       selected: state.ends_date ? [state.ends_date] : []
  //     }))
  //   })

  const ends_time_input = isolate(TimeInput)(
    sources, {
      ...inputs,
      props$: state$.take(1).map((state: any) => state.ends_time)
    }
  )
  

  begins_date$.attach(begins_date_input.output$)
  begins_time$.attach(begins_time_input.output$)
  //ends_date$.attach(ends_date_input.output$)
  ends_time$.attach(ends_time_input.output$)

  const components = {
    begins_date: begins_date_input.DOM,
    begins_time: begins_time_input.DOM,
    //ends_date: ends_date_input.DOM,
    ends_time: ends_time_input.DOM
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    output$: state$
  }
}
