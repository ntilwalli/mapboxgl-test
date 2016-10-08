import {Observable as O} from 'rxjs'
import view from './view'
import intent from './intent'
import model from './model'
import getModal from './getModal'
import {RRule} from 'rrule'
import moment = require('moment')

import {div} from '@cycle/dom'

import {combineObj, spread, normalizeComponent, normalizeSink, createProxy} from '../../../utils'

import {getMomentFromCurrentDate} from '../helpers'
import Heading from '../../../library/heading/workflow/main'
import Step from '../step/main'
import StepContent from '../stepContent/standard'

import RadioInput from '../../../library/radioInput'
import SelectionCalendar from '../../../library/selectionCalendar/main'
import RecurrenceCalendar from './recurrenceCalendar/main'

function contentComponent(sources, inputs) {

  const actions = intent(sources)

  const frequencyInput = RadioInput(sources, {
    styleClass: `.circle`,
    options: [{
      displayValue: `Weekly`,
      value: RRule.WEEKLY.toString()
    },{
      displayValue: `Monthly`,
      value: RRule.MONTHLY.toString()
    }],
    props$: actions.listing$
      .map(listing => {
        return listing && listing.profile && 
               listing.profile.time && 
               listing.profile.time.frequency
      })
      .map(freq => ({selected: freq ? freq.toString() : undefined}))
  })

  const hideModal$ = createProxy()
  const modalResult$ = createProxy()
  const action$ = createProxy()
  const state$ = model(actions, spread(inputs, {
    frequency$: frequencyInput.selected$,
    modalResult$,
    hideModal$,
    action$,
    listing$: actions.listing$
  }))

  const modal$ = state$
    .map(x => {
      return x
    })
    .distinctUntilChanged(null, x => x.modal)
    .map(x => {
      return x
    })
    .map(state => getModal(sources, inputs, {modal: state.modal, listing: state.listing}))
    .publishReplay(1).refCount()

  hideModal$.attach(normalizeSink(modal$, `close$`))
  modalResult$.attach(normalizeSink(modal$, `done$`))

  const selectionCalendar$ = state$.map(state => {
    const {listing, valid, displayYear, displayMonth} = state
    if (valid) {
      const dMoment = moment({
        year: displayYear,
        month: displayMonth
      })
      const startDate = listing.profile.time.startDate
      const until = listing.profile.time.until
      const rangeStart = getMomentFromCurrentDate(startDate).startOf("month")
      const rangeEnd = until ? getMomentFromCurrentDate(until).endOf("month") : undefined

      const startMoment = dMoment.startOf('month').toDate()
      const endMoment = dMoment.endOf('month').toDate()
      const theRule = new RRule(listing.profile.time.rrule)
      const between = theRule.between(startMoment, endMoment)
      const sc = RecurrenceCalendar(sources, spread(inputs, {
        props$: O.of({
          year: state.displayYear,
          month: state.displayMonth,
          rangeStart,
          rangeEnd,
          selected: between
        })
      }))

      return sc

    } else {
      return {
        DOM: O.of(null)
      }
    }
  }).publishReplay(1).refCount()

  action$.attach(normalizeSink(selectionCalendar$, `action$`))
  // statSelectionCalendar(sources, {
  //   props$: state$.filter(state => {

  //   })
  // })

  const components = {
    frequency$: frequencyInput.DOM,
    selectionCalendar$: selectionCalendar$.switchMap(x => x.DOM),
    modal$: modal$.switchMap(x => x.DOM)
  }

  const vtree$ = view(state$, components)

  return {
    DOM: vtree$,
    state$: state$
      .map(x => {
        return x
      }).publishReplay(1).refCount()
  }

  // return {
  //   DOM: O.of(div([`Hello`])),//vtree$,
  //   // HTTP: O.never(),
  //   // Global: O.never(),
  //   state$: O.merge(O.of({
  //     listing: {},
  //     valid: false
  //   }), O.never())//state$
  //   // .do(x => console.log(`to state out`, x))
  //   // .map(x => {
  //   //   return x
  //   // }).publishReplay(1).refCount()
  // }
}

export default function main(sources, inputs) {

  const stepProps = O.of({
    contentComponent,
    create: false,
    nextRequiresListingId: true,
    next: `preview`,
    previous: listing => {
      const profile = listing.profile
      const location = profile.location
      if (location.mode === `address`) {
        return `confirmAddressLocation`
      } else {
        return `location`
      }
    }
  })

  const content = StepContent(sources, spread(inputs, {
    props$: stepProps
  }))

  const headingGenerator = (saving$) => normalizeComponent(Heading(sources, spread(
    inputs, {
      saving$
    })))

  const instruction = {
    DOM: O.of(div([`Hello`]))
  }

  const workflowStep = Step(sources, spread(inputs, {
    headingGenerator, 
    content, 
    instruction, 
    props$: O.of({
      panelClass: `create-recurrence`
    })
  }))



  return workflowStep

  // return {
  //   DOM: workflowStep.DOM
  // }
}
