import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify} from '../../../../../../utils'

import BootstrapTimeInput from '../../../../../../library/bootstrapTimeInputWithUndefined'
import {applySingleCuando, applyRecurringCuando} from '../helpers'
import {ListingTypes} from '../../../../../../listingTypes'

function applyChange(session, val) {
  session.properties.cuando.end_time = val
  if (session.listing.type === ListingTypes.SINGLE) {
    applySingleCuando(session)
  } else {
    applyRecurringCuando(session)
  }
}

export default function main(sources, inputs) {
  const out = isolate(BootstrapTimeInput)(sources, inputs.session$.map(s => s.properties.cuando.end_time))

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        data: val, 
        apply: applyChange,
        errors: [], 
        valid: true
      }
    })
  }
}