import {div, span, ul, li} from '@cycle/dom'
import {combineObj} from '../../../../utils'
import moment = require('moment')

import {CostOptions, TierPerkOptions, StageTimeOptions, MinutesTypeOptions} from '../../../../listingTypes'

import {
  renderName, renderCuando, renderDonde, 
  renderCuandoStatus, renderCost, renderStageTime, renderPerformerSignup,
  renderPerformerLimit, renderTextList
} from '../../../helpers/listing/renderBootstrap'


function getSimpleCost(performer_cost) {
  if (performer_cost.length) {
    if (performer_cost.some(x => x.type === CostOptions.FREE)) {
      return CostOptions.FREE
    } else {
      return CostOptions.PAID
    }
  }

  return undefined
}

function getAggregateStageTime(stage_time) {

  if (stage_time.every(x => x.type === StageTimeOptions.MINUTES)) {
    const datas = stage_time.map(x => x.data.minutes)

    if (datas.every(x => x.type === MinutesTypeOptions.MAX)) {
      const max = datas.reduce((acc, val) => acc + val.data.max, 0)
      return {
        type: StageTimeOptions.MINUTES,
        data: {
          minutes: {
            type: MinutesTypeOptions.MAX,
            data: {
              max
            }
          }
        }
      }
    } else if (datas.every(x => x.type === MinutesTypeOptions.RANGE)) {
      const min = datas.reduce((acc, val) => acc + val.data.min, 0)
      const max = datas.reduce((acc, val) => acc + val.data.max, 0)
      return {
        type: StageTimeOptions.MINUTES, 
        data: {
          minutes: {
            type: MinutesTypeOptions.RANGE,
            data: {min, max}
          }
        }
      }
    } else {
      return undefined
    }
  } else if (stage_time.every(x => x.type === StageTimeOptions.SONGS)) {
    return {type: StageTimeOptions.SONGS, data: {songs: stage_time.reduce((acc, val) => acc + val.data.songs, 0)}}
  } else if (stage_time.every(x => x.type === StageTimeOptions.MINUTES_OR_SONGS)) {
    return undefined
  } else {
    return undefined
  }
}

function getMaxStageTime(stage_time) {
  const aggregate: any = getAggregateStageTime(stage_time)

  if (aggregate) {
    switch (aggregate.type) {
      case StageTimeOptions.MINUTES:
        return {type: StageTimeOptions.MINUTES, data: aggregate.data.minutes.data.max}
      case StageTimeOptions.SONGS:
        return {type: StageTimeOptions.SONGS, data: aggregate.data.songs}
      default:
        throw new Error()
    }
  }
}

function getMaxOfCostPerk(performer_cost, perk_type) {
  const minutes = performer_cost
    .filter(x => x.perk && x.perk.type === perk_type)
    .map(x => x.perk.data)
    .sort()

  const length = minutes.length
  if (length) {
    return minutes[length - 1]
  } else {
    return undefined
  }
}

function calculateMaxMinutes(baseline, cost_minutes, additional) {
  if (baseline) {
    if (cost_minutes && additional) {
      return Math.max(cost_minutes, baseline + additional)
    } else if (additional) {
      return baseline + additional
    } else if (cost_minutes) {
      return Math.max(cost_minutes, baseline)
    }
  } else {
    if (cost_minutes) {
      return cost_minutes
    } 
  }

  return undefined
}

// remove those without stage_time specified
function deriveMaxPossibleStageTime(result) {

  const {stage_time, performer_cost} = result

  if (stage_time.length >= 1) {
    if (performer_cost.length <= 1) {
      const {type, data} = getMaxStageTime(stage_time)
      return data
    } else {
      const {type, data} = getMaxStageTime(stage_time)
      const cost_minutes = getMaxOfCostPerk(performer_cost, TierPerkOptions.MINUTES)
      const additional = getMaxOfCostPerk(performer_cost, TierPerkOptions.ADDITIONAL_MINUTES)
      return calculateMaxMinutes(data, cost_minutes, additional)
    }
  } else {
    const cost_minutes = getMaxOfCostPerk(performer_cost, TierPerkOptions.MINUTES)
    if (cost_minutes) {
      return cost_minutes
    }

    return undefined
  }
}

function normalizeForFiltering(result) {
  const derived_stage_time = deriveMaxPossibleStageTime(result.listing.meta)

  const out = {
    id: result.listing.id,
    result,
    cost: getSimpleCost(result.listing.meta.performer_cost),
    stage_time: derived_stage_time,
    categories: result.listing.meta.categories,
    note: result.listing.meta.note
  }

  //console.log(out)

  return out

}

function hasCategories(result, filterCategories, categories) {
  if (filterCategories) {
    console.log(result)
    return categories.every(x => result.categories.indexOf(x) > -1)
  }
  else {
    return true
  }
}

function hasCosts(result, filterCosts, costs) {
  if (filterCosts) {
    return costs.some(x => result.cost === x)
  } else {
    return true
  }
}

function hasMinimumStageTime(result, filterStageTime, stageTime) {
  if (filterStageTime) {
    if (stageTime) {
      return result.stageTime >= stageTime
    }
  }

  return true
}

function applyFilters(results, filters) {
  //console.log(filters)
  const {filterCategories, filterCosts, filterStageTime, categories, costs, stageTime} = filters
  const listings = {}
  results.forEach(x => listings[x.listing.id] = x)
  const normalized = results.map(normalizeForFiltering)

  console.log('normalized results', normalized)
  const filtered = normalized
    // .filter(x => hasCategories(x.meta, filterCategories, categories))
    // .filter(x => hasCosts(x.meta, filterCosts, costs))
    // .filter(x => hasMinimumStageTime(x.meta, filterStageTime, stageTime))

  return filtered.map(x => x.result)
}

const compareBegins = (a, b) => {
  const aVal = a.listing.cuando.begins
  const bVal = b.listing.cuando.begins
  return aVal - bVal
}




export function renderListingResult(listing) {
  const {type, donde, cuando, meta} = listing
  const {
    name, event_types, categories, notes, 
    performer_cost, description, contact_info, 
    performer_sign_up, stage_time, 
    performer_limit, listed_hosts} = meta

  return div('.container-fluid.no-gutter', [
    div('.row.no-gutter', [
      div('.col-xs-6', [
        div('.row.no-gutter', [
          renderName(name)
        ]),
        div('.row.no-gutter', [
          renderCuando(listing)
        ]),
        div('.row.no-gutter', [
          renderDonde(donde)
        ])
      ]),
      div('.col-xs-6', [
        div('.row.no-gutter.clearfix', [
          renderCuandoStatus(cuando)
        ]),
        performer_cost ? div('.row.no-gutter.clearfix', [
          renderCost(listing)
        ]) : null,
        stage_time ? div('.row.no-gutter.clearfix', [
          renderStageTime(stage_time)
        ]) : null,
        performer_sign_up ? div('.row.no-gutter.clearfix', [
          renderPerformerSignup(performer_sign_up)
        ]) : null,
        performer_limit ? div('.row.no-gutter.clearfix', [
          renderPerformerLimit(performer_limit)
        ]) : null,
        categories.length ? div('.row.no-gutter.clearfix', [
          renderTextList(categories)
        ]) : null,
        // event_types.length ? div('.row.no-gutter.clearfix', [
        //   renderTextList(event_types)
        // ]) : null
      ])
    ])
  ])
}



export default function view(state$) {
  return state$.map(state => {
    //console.log(state)
    const {results, filters} = state
    const withFilters = applyFilters(results, filters)
    const sorted = withFilters.sort(compareBegins)

    return ul(
      '.list-group', 
      //['Hi there']
      sorted
        .map(x => li('.appResult.list-group-item.sm-padding', {props: {searchResult: x}}, [renderListingResult(x.listing)]))
    )
  })
}

