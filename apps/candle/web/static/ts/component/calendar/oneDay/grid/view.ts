import {div, span} from '@cycle/dom'
import {combineObj} from '../../../../utils'
import moment = require('moment')

const compareBegins = (a, b) => {
  const aVal = a.listing.cuando.begins
  const bVal = b.listing.cuando.begins
  return aVal - bVal
}

function renderName(name) {
  //console.log(name)
  return div(`.result-name`, [name])
}

function getEventStatusClass(cuando) {
  const {begins} = cuando
  const ends = cuando.ends ? cuando.ends : begins.clone().add(120, 'minutes')

  if (moment().isBefore(begins)) {
    //console.log(moment().add(30, 'minutes').isAfter(begins))
    if (moment().add(30, 'minutes').isAfter(begins)) {
      return `.near-future`
    } else {
      return `.future`
    }
  } else {
    if (moment().isAfter(ends)) {
      if(moment().subtract(12, 'hours').isBefore(ends)) {
        return `.recent-past`
      } else {
        return `.past`
      }
    } else {
      return `.in-progress`
    }
  }
}

function renderBegins(cuando) {
  const {begins} = cuando
  const statusClass = getEventStatusClass(cuando)
  if (moment().isBefore(begins)) {
    return div(`.result-begins${statusClass}`, [
      span(`.begins`), span(`.time`, [begins.format(`h:mm A`)])
    ])
  } else {
    return div(`.result-began${statusClass}`, [
      span(`.began`), span(`.time`, [begins.format(`h:mm A`)])
    ])
  }
}

function renderEnds(cuando) {
  const {begins, ends} = cuando
  const statusClass = getEventStatusClass(cuando)
  if (ends) {
    if (moment().isBefore(ends)) {
      return div(`.result-ends${statusClass}`, [
        span(`.ends`), span(`.time`, [ends.format(`h:mm A`)])
      ])
    } else {
      return div(`.result-ended${statusClass}`, [
        span(`.ended`), span(`.time`, [ends.format(`h:mm A`)])
      ])
    }
  } else {
    return null
  }
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

// function isPaid(result) {
//   const {listing} = result
//   const {meta} = listing
//   const {cost} = meta
//   switch (cost.type) {
//     case "cover":
//     case "cover_or_purchase_time":
//     case "cover_drink_included":
//     case "cover_plus_upgrades":
//     case "minimum_purchase":
//     case "minimum_purchase_plus_upgrades":
//     case "cover_plus_minimum_purchase":
//     case "cover_or_minimum_purchase":
//       return true
//     default:
//       return false
//   }
// }

function renderCost(cost) {
  if (!cost) {
    return div(`.result-cost`, [`Free`])
  }

  let upgrade, amount, data

  switch (cost.type) {
    case "free":
      return div(`.result-cost`, [`Free`])
    case "free_purchase_encouraged":
      return div(`.result-cost`, [`Free (purchase encouraged)`])
    case "free_plus_upgrade":
      return div(`.result-cost`, [`Free + pay perks`])
    case "cover":
      data = cost.data
      return div(`.result-cost`, [`$${data.cover}`])
    case "cover_or_purchase_time":
      data = cost.data
      upgrade = data.upgrades[0]
      const [cost_per_min, max_min] = upgrade.type.data
      return div(`.result-cost`, [`$${data.cover} or $${cost_per_min} per minute`])
    case "cover_drink_included":
      data = cost.data
      return div(`.result-cost`, [`$${data.cover} (drink included)`])
    case "cover_plus_upgrades":
      data = cost.data
      upgrade = data.upgrades[0]
      amount = upgrade.type.data
      const minutes = upgrade.item.data
      return div(`.result-cost`, [`$${data.cover} + purchase perks`])
    case "minimum_purchase":
      data = cost.data
      return div(`.result-cost`, [`${data.minimum_purchase} item${data.minimum_purchase > 1 ? 's' : ''}`])
    case "minimum_purchase_plus_upgrades":
      data = cost.data
      upgrade = data.upgrades[0]
      amount = upgrade.type.data
      return div(`.result-cost`, [`${data.minimum_purchase} item${data.minimum_purchase > 1 ? 's' : ''} + pay perks`])
    case "cover_plus_minimum_purchase":
      data = cost.data
      return div(`.result-cost`, [`$${data.cover} + ${data.minimum_purchase} item${data.minimum_purchase > 1 ? 's' : ''}`])
    case "cover_or_minimum_purchase":
      data = cost.data
      return div(`.result-cost`, [`$${data.cover} or ${data.minimum_purchase} item${data.minimum_purchase > 1 ? 's' : ''}`])
    default:
      throw new Error("Invalid cost type for listing result: ${cost.type}")
  }
}



function renderStageTimeRound(st) {
  if (st.type === "max") {
    return `${st.data}`
  } else if (st.type === "range") {
    const [min, max] = st.data
    return `${min}-${max}`
  }
}


function renderStageTime(stage_time) {
  if (!stage_time || stage_time.length === 0) {
    return null
  }

  let upgrade, amount, data

  const length = stage_time.length
  if (length === 1) {
    return div(`.result-stage-time`, [
      renderStageTimeRound(stage_time[0]) + " mins"
    ])
  } else if (length === 2) {
    const round1 = stage_time[0]
    const round2 = stage_time[1]
    return div(`.result-stage-time`, [
      renderStageTimeRound(round1) + " + " + renderStageTimeRound(round2) + " mins"
    ])
  } else {
    throw new Error("Only up to two rounds supported...")
  }
}

function renderPerformerLimit(performer_limit) {

  if (performer_limit) {
    const {type, data} = performer_limit
    return div(`.result-performer-limit`, [
      (type === "limit" ? data.limit : `${data.min}-${data.max}`) + ' people'
    ])
  }
  return null
}

function renderDonde(donde) {
  return div(`.result-donde`, [
    div(`.name`, [donde.name]),
    div(`.street`, [donde.street]),
    div(`.city`, [donde.city])
  ])
}

function renderStatus(cuando) {
  const statusClass = getEventStatusClass(cuando)
  let val;
  switch (statusClass) {
    case ".near-future":
      val = "Starting soon"
      break;
    case ".future":
      val = "upcoming"
      break;
    case ".past":
      val = "Past"
      break;
    case ".recent-past":
      val = "Past"
      break;
    case ".in-progress":
      val = "In progress"
      break;
    default:
      throw new Error("Invalid status class: ${statusClass}")
  }

  if (statusClass !== ".future")
    return div(`.result-status${statusClass}`, [val])
  else
    return null
}

function renderSignUpStart(cuando, sign_up) {
  const start = cuando.begins
  const {begins} = sign_up
  if (begins) {
    return div(`.result-sign-up-begins`, [`${-begins} mins before`])
  }

  return null
}

function renderSignUpMethod(method) {
  //console.log(method.type)
  switch (method.type) {
    case "website":
    case "website_priority":
      return "website"
    case "in_person":
      return "in-person"
    case "email":
    case "email_with_upgrade":
    case "email_priority":
      return "email"
    default:
      console.log(method.type)
      throw new Error("Invalid sign-up method: ${method.type}")
  }
}

function renderSignUpMethods(sign_up) {
  const {methods} = sign_up
  //console.log(methods)
  if (Array.isArray(methods)) {
    return div(`.result-sign-up-methods`, methods.map(renderSignUpMethod).join('/'))
  } 

  return null
}

function renderSignup(cuando, sign_up) {
  if (sign_up) {
    //console.log(sign_up)
    return div(`.result-sign-up`, [
      renderSignUpStart(cuando, sign_up),
      renderSignUpMethods(sign_up)
    ])
  }

  return null

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

