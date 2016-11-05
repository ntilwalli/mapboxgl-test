import {Observable as O} from 'rxjs'
import {processHTTP} from '../../../utils'
import moment = require('moment')

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"
const onlySingleBadslava = x => {
  const listing = x.listing
  return listing.type === "single" && listing.meta.type === "badslava" && listing.cuando.begins
}
const inflate = x => {
  const listing = x.listing
  const {cuando, meta} = listing
  const {begins, ends} = cuando
  const {sign_up, check_in} = meta

  if (begins) {
    const inflated_begins = moment(begins)
    listing.cuando.begins = inflated_begins

    // if (sign_up) {
    //   if (sign_up.begins) {
    //     meta.sign_up.begins = inflated_begins.clone().add(sign_up.begins, 'minutes')
    //   }

    //   if (sign_up.ends) {
    //     meta.sign_up.ends = inflated_begins.clone().add(sign_up.ends, 'minutes')
    //   }
    // }

    // if (check_in) {
    //   if (check_in.begins) {
    //     meta.check_in.begins = inflated_begins.clone().add(check_in.begins, 'minutes')
    //   }

    //   if (check_in.ends) {
    //     meta.check_in.ends = inflated_begins.clone().add(check_in.ends, 'minutes')
    //   }
    // }

  }

  if (ends) {
    listing.cuando.ends = moment(ends)
  }

  return x
}



export default function intent(sources) {
  const {HTTP, Global} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `searchOneDay`)
  const success$ = good$
    .filter(onlySuccess)
    .pluck(`data`)
    .map(x => x.filter(onlySingleBadslava).map(inflate))
    .publish().refCount()

  const geolocation$ = Global.geolocation$

  const cached$ = sources.Storage.local.getItem(`calendar/oneDay`)
    .map(stored => {
      //console.log(`from storage:`, stored)
      if (stored) {
        const val = JSON.parse(stored)
        val.searchDateTime = moment(val.searchDateTime)
        val.results = val.results.map(inflate)
        // console.log(`stored transformed:`, stored)
        return val
      }

      // console.log(`stored not transformed:`, stored)
      return stored
    })

  return {
    results$: success$,
    cached$,
    geolocation$
  }
}

