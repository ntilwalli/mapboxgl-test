import {Observable as O} from 'rxjs'
import {drillInflate} from './helpers'
import moment = require('moment')

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"
// const onlySingleBadslava = x => {
//   //console.log(x)
//   const listing = x.listing
//   return listing.type === "single" && listing.meta.type === "badslava" && listing.cuando.begins
// }



export default function intent(sources) {
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
    cached$
  }
}

