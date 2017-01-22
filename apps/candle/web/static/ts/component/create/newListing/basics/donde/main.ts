import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify} from '../../../../../utils'

import Venue from './venue'
import SearchArea from './searchArea'

function applyChange(session, val) {
  session.listing.meta.name = val
}

export default function main(sources, inputs) {

  const search_area = SearchArea(sources, inputs)

  return {
    ...search_area,
    output$: O.combineLatest(search_area.output$)
  }
}