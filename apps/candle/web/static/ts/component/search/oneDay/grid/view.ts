import {div, span} from '@cycle/dom'
import {combineObj} from '../../../../utils'
import * as renderHelpers from '../../../renderHelpers/listing'
import moment = require('moment')

const {renderName, renderBegins, renderEnds, renderCost, 
  renderStageTime, renderPerformerLimit, renderDonde, 
  renderStatus, renderSignup} = renderHelpers

const compareBegins = (a, b) => {
  const aVal = a.listing.cuando.begins
  const bVal = b.listing.cuando.begins
  return aVal - bVal
}

function renderResult(result) {
  const {listing} = result
  const {name, cuando, donde, meta} = listing
  const {begins, ends} = cuando
  const {cost, sign_up, stage_time, performer_limit} = meta
  return div(`.appResult.result`, {props: {searchResult: result}}, [
    div(`.left`, [
      renderName(name),
      renderBegins(cuando),
      renderEnds(cuando),
      renderDonde(donde)
    ]),
    div(`.right`, [
      renderStatus(cuando),
      renderCost(cost),
      renderStageTime(stage_time),
      renderSignup(cuando, sign_up),
      renderPerformerLimit(performer_limit)
    ])

    // renderCheckin(meta),
    // renderHosts(meta)
  ])
}

function getSimpleCost(result) {
  const {listing} = result
  const {meta} = listing
  const {cost} = meta
  if (cost) {
    switch (cost.type) {
      case "free":
      case "free_purchase_encouraged":
      case "free_plus_upgrade":
        return "free"
      default:
        return "paid"
    }
  } else {
    return "free"
  }
}

function getSimpleStageTime(result): [any, any] {
  const {listing} = result
  const {meta} = listing
  const {stage_time} = meta
  if (stage_time && stage_time.length) {
    let out = 0
    stage_time.forEach(x => {
      if (x.type === "max") { out += x.data }
      else if (x.type === "range") { 
        const [min, max] = x.data
        out += min
      }
      else { throw new Error(`Invalid stage_time type`) }
    })

    return [result, out]
  }

  return [result, undefined]
  
}

function augmentStageTimeWithSignupUpgrades([result, amount]): [any, any] {
  if (amount) {
    const out = amount
    const {listing} = result
    const {meta} = listing
    const {sign_up} = meta
    const {type, data} = sign_up
    let increment
    switch (type) {
      case "email_with_upgrade":
        const {upgrades} = data
        if (upgrades.length) {
          const upgrade = upgrades[0]
          if (upgrade.type === "additional_stage_time") {
            return [result, amount + upgrade.data]
          }
        }
      default:
        return [result, amount]
    }
  }

  return [result, amount]
}


function augmentStageTimeWithCostUpgrades([result, amount]): [any, any] {
  if (amount) {
    const {listing} = result
    const {meta} = listing
    const {cost} = meta
    const {type, data} = cost
    let upgrade_item, upgrade_type, upgrade, length
    switch (type) {
    case "free_plus_upgrade":
    case "cover_plus_upgrades":
      upgrade = data.upgrades[0]
      upgrade_item = upgrade.item
      if (upgrade_item.type === `additional_stage_time`) {
        return [result, amount + upgrade_item.data]
      }

      break;
    case "cover_or_purchase_time":
      upgrade = data.upgrades[0]
      upgrade_type = upgrade.type
      upgrade_item = upgrade.item
      if (upgrade_type.type === `pay_with_min_max` && upgrade_item.type === `stage_time`) {
        return [result, upgrade_type.data[2]]
      }
      
      break;
    default:
      break
    }
  }

  return [result, amount]
}

function normalizeStageTime(result) {
  return augmentStageTimeWithCostUpgrades(augmentStageTimeWithSignupUpgrades(getSimpleStageTime(result)))
}

function normalizeForFiltering(result) {
  const [_, stageTime] = normalizeStageTime(result)

  const out = {
    id: result.listing.id,
    result,
    cost: getSimpleCost(result),
    stageTime,
    categories:result.listing.categories
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
  const filtered = normalized
    .filter(x => hasCategories(x, filterCategories, categories))
    .filter(x => hasCosts(x, filterCosts, costs))
    .filter(x => hasMinimumStageTime(x, filterStageTime, stageTime))

  return filtered.map(x => x.result)
}

export default function view(state$) {
  return state$.map(state => {
    //console.log(state)
    const {results, filters} = state
    const withFilters = applyFilters(results, filters)
    const sorted = withFilters.sort(compareBegins)

    return div(
      `.one-day-grid`, 
      sorted.map(renderResult)
    )
  })
}

