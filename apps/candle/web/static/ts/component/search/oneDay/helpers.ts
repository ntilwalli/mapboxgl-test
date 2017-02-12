import {inflateListing} from '../../helpers/listing/utils'

export function getDefaultFilters() {
  return {
    filterCategories: false,
    categories: [],
    filterCosts: false,
    costs: [],
    filterStageTime: false,
    stageTime: undefined
  }
}

export function drillInflate(result) {
  result.listing = inflateListing(result.listing)
  return result
}