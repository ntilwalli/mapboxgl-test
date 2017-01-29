import {Observable as O} from 'rxjs'
import {processHTTP, inflateListing} from '../../../utils'
import moment = require('moment')

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"
// const onlySingleBadslava = x => {
//   //console.log(x)
//   const listing = x.listing
//   return listing.type === "single" && listing.meta.type === "badslava" && listing.cuando.begins
// }

const onlySingleStandard = x => {
  //console.log(x)
  const listing = x.listing
  //if (listing.type === "single" && listing.meta.type === "standard" && listing.cuando.begins) {
  if (listing.type === "single" && listing.cuando.begins) {
    return true
  } else {
    return false
  }
}

function drillInflate(result) {
  result.listing = inflateListing(result.listing)
  return result
}

export default function intent(sources) {
  const {DOM, HTTP, Global} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `searchOneDay`)
  const success$ = good$
    .filter(onlySuccess)
    .pluck(`data`)
    .map(x => {
      const tmp1 = x.map(l => l.listing.id)
      const tmp2 = x.map(l => l.listing)
      const out = x.filter(onlySingleStandard).map(drillInflate)
      return out
    })
    .publish().refCount()

  // const error$ = good$
  //   .filter(onlyError)
  //   .pluck(`data`)
  //   .subscribe(x => console.log(`listing search error`, x))

  const cached$ = sources.Storage.local.getItem(`calendar/oneDay`)
    .map(stored => {
      //console.log(`from storage:`, stored)
      if (stored) {
        const val = JSON.parse(stored)
        val.searchDateTime = moment(val.searchDateTime)
        val.results = val.results.map(drillInflate)
        // console.log(`stored transformed:`, stored)
        return val
      }

      // console.log(`stored not transformed:`, stored)
      return stored
    })


  return {
    results$: success$,
    cached$
  }
}

