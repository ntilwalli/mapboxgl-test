import {Observable as O} from 'rxjs'
import {RRule, RRuleSet, rrulestr} from 'rrule'
import {toMoment} from '../../../utils'

function convertToDates(val) {
  const len = val.length
  let d
  const out = new Array(len)
  for (let i = 0; i < length; i++) {
    d = val[i]
    out[i] = toMoment(typeof d === `string` ? new Date(d) : d)
  }
  return out
}

export default function intent(sources, inputs) {
  const {DOM, Router} = sources

  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .map(listing => {
      const time = listing.profile.time
      if (time) {
        const {rrule, rdate, exrule, exdate} = time
        if (rrule) {
          let {dtstart, until} = rrule
          listing.profile.time.rrule.dtstart = dtstart ? toMoment(typeof dtstart === `string` ? new Date(dtstart) : dtstart) : dtstart
          listing.profile.time.rrule.until = until ? toMoment(typeof until === `string` ? new Date(until) : until) : until
        }

        if (exrule) {
          let {dtstart, until} = exrule
          listing.profile.time.exrule.dtstart = dtstart ? toMoment(typeof dtstart === `string` ? new Date(dtstart) : dtstart) : dtstart
          listing.profile.time.exrule.until = until ? toMoment(typeof until === `string` ? new Date(until) : until) : until
        }

        if (Array.isArray(rdate)) {
          listing.profile.time.rdate = convertToDates(rdate)
        }

        if (Array.isArray(exdate)) {
          listing.profile.time.exdate = convertToDates(exdate)
        }
      }

      return listing
    })
    .publishReplay(1).refCount()

    const showChangeStartDate$ = DOM.select(`.appChangeStartDate`).events(`click`)
      .mapTo(`startDate`)
    const showChangeUntilDate$ = DOM.select(`.appChangeUntilDate`).events(`click`)
      .mapTo(`untilDate`)

    const showChangeStartTime$ = DOM.select(`.appChangeStartTime`).events(`click`)
      .mapTo(`startTime`)
    const showChangeEndTime$ = DOM.select(`.appChangeEndTime`).events(`click`)
      .mapTo(`endTime`)
    
  return {
    listing$,
    showModal$: O.merge(
      showChangeStartDate$,
      showChangeUntilDate$,
      showChangeStartTime$,
      showChangeEndTime$
    )
  }
}
