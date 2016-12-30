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
  return listing.type === "single" && listing.meta.type === "standard" && listing.cuando.begins
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
    .map(x => x.filter(onlySingleStandard).map(drillInflate))
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

  const addDay$ = DOM.select(`.appAddDay`).events(`click`)
    .mapTo(1)
  const subtractDay$ = DOM.select(`.appSubtractDay`).events(`click`)
    .mapTo(-1)

  const change_date$ = O.merge(addDay$, subtractDay$)

  const show_filters$ = DOM.select(`.appShowFilters`).events(`click`)

  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)

  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)

  return {
    results$: success$,
    cached$,
    change_date$,
    show_filters$,
    show_menu$,
    brand_button$
  }
}

