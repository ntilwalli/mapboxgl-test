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
  }

  if (ends) {
    listing.cuando.ends = moment(ends)
  }

  return x
}

export default function intent(sources) {
  const {DOM, HTTP, Global} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `searchOneDay`)
  const success$ = good$
    .filter(onlySuccess)
    .pluck(`data`)
    .map(x => x.filter(onlySingleBadslava).map(inflate))
    .publish().refCount()

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

  const addDay$ = DOM.select(`.appAddDay`).events(`click`)
    .mapTo(1)
  const subtractDay$ = DOM.select(`.appSubtractDay`).events(`click`)
    .mapTo(-1)

  const changeDate$ = O.merge(addDay$, subtractDay$)

  const showFilters$ = DOM.select(`.appShowFilters`).events(`click`)

  const showMenu$ = DOM.select(`.appMenuButton`).events(`click`)

  const login$ = DOM.select(`.appShowLoginButton`).events(`click`)
  const logout$ = DOM.select(`.appShowLogoutButton`).events(`click`)
  return {
    results$: success$,
    cached$,
    changeDate$,
    showFilters$,
    showMenu$,
    login$,
    logout$
  }
}

