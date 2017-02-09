import {Observable as O} from 'rxjs'
import {div, h4} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks} from '../../../utils'
import ListingQuery from '../../../query/listingQuery'
import {ListingQueryRequest} from '../../../interfaces'
import {RecurrenceDisplayFilterOptions} from '../../../listingTypes'
import {recurrenceDisplayFilterOptionToRange, inflateListing} from '../../helpers/listing/utils'
import ComboBox from '../../../library/comboBox'
import RecurrenceDisplay from './recurrenceDisplay'

function sortDates(x, y) {
  return x.cuando.begins - y.cuando.begins
}

function view(components) {
  return combineObj(components).map((info: any) => {
    return div('.container.nav-fixed-offset.mt-4.d-flex.flex-column', [
      div('.d-flex.flex-row.justify-content-between.mb-2', [
        h4(['Calendar']), 
        div({style: {flex: '0 0 fixed'}}, [info.date_range])
      ]),
      div('.d-flex', [
        info.recurrence_display
      ])
    ])
  })
}

export default function main(sources, inputs) {
  const options = [
    RecurrenceDisplayFilterOptions.ALL,
    RecurrenceDisplayFilterOptions.NEXT_30_DAYS,
    RecurrenceDisplayFilterOptions.LAST_30_DAYS,
    RecurrenceDisplayFilterOptions.ALL_FUTURE,
    RecurrenceDisplayFilterOptions.ALL_PAST
  ]

  const date_range = isolate(ComboBox)(sources, options, O.of(RecurrenceDisplayFilterOptions.NEXT_30_DAYS))

  const query$: O<ListingQueryRequest> = combineObj({
      result$: inputs.props$
        .map(x => {
          return x
        }),
      date_range$: date_range.output$
        .map(x => {
          return x
        })
    })
    .map((info: any) => {
      return {
        parent_id: info.result.listing.id,
        cuando: recurrenceDisplayFilterOptionToRange(info.date_range)
      }
    })

  const listing_query = ListingQuery(sources, {props$: query$})
  const recurrence_display = RecurrenceDisplay(sources, {...inputs, props$: listing_query.output$.map(x => x.map(inflateListing))})

  const components = {
    date_range$: date_range.DOM,
    recurrence_display$: recurrence_display.DOM
  }

  const vtree$ = view(components)
  const merged = mergeSinks(listing_query, recurrence_display, date_range)

  return {
    ...merged,
    DOM: vtree$
  }

}