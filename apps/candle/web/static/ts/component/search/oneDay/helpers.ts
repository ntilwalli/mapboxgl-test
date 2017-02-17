import {inflateListing} from '../../helpers/listing/utils'
import {EventTypes} from '../../../listingTypes'

export function getDefaultFilters() {
  return {
    event_types: [EventTypes.OPEN_MIC],
    categories: ['/comedy/open_mic'],
    costs: undefined,
    stageTime: undefined
  }
}

export function drillInflate(result) {
  result.listing = inflateListing(result.listing)
  return result
}