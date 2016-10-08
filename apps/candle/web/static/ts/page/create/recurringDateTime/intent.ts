import {Observable as O} from 'rxjs'
import {RRule, RRuleSet, rrulestr} from 'rrule'
import {toMoment} from '../../../utils'
import {inflate} from '../listing'

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

export default function intent(sources) {
  const {DOM, Router} = sources

  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .map(x => {
      return inflate(x)
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
