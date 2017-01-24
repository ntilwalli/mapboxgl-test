import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify} from '../../../../../utils'

import BootstrapDateInput from '../../../../../library/bootstrapDateInput'
import {applySingleCuando, applyRecurringCuando} from './helpers'
import {ListingTypes} from '../../../../../listingTypes'

function applyChange(session, val) {
  session.listing.type = ListingTypes.SINGLE
  session.properties.cuando.date = val
  applySingleCuando(session)
}

export default function main(sources, inputs) {
  const props$ = inputs.session$.map(s => s.properties.cuando.date)
  const out = isolate(BootstrapDateInput)(sources, {...inputs, props$})

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