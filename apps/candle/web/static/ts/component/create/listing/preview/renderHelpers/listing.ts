import {div, span, a, i} from '@cycle/dom'
import moment = require('moment')

export function renderName(name) {
  //console.log(name)
  return div(`.result-name`, [name])
}

function getEventStatusClass(cuando) {
  //onsole.log(cuando)
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

function getDateTimeString(d) {
  if (moment().isSame(d, "day")) {
    return "Today, " + d.format(`h:mm A`)
  } else if (moment().add(1, "day").isSame(d, "day")) {
    return "Tomorrow, " + d.format(`h:mm A`)
  } else if (moment().subtract(1, "day").isSame(d, "day")) {
    return "Yesterday, " + d.format(`h:mm A`)
  } else {
    return d.format(`llll`)
  }
}

export function renderDateTimeBegins(cuando) {
  const {begins} = cuando
  const statusClass = getEventStatusClass(cuando)
  if (moment().isBefore(begins)) {
    return div(`.result-begins${statusClass}`, [
      span(`.begins`), span(`.date-time`, [getDateTimeString(begins)])
    ])
  } else {
    return div(`.result-began${statusClass}`, [
      span(`.began`), span(`.date-time`, [getDateTimeString(begins)])
    ])
  }
}

export function renderDateTimeEnds(cuando) {
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


export function renderBegins(cuando) {
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

export function renderEnds(cuando) {
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

export function renderCost(cost) {
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
    case "paid":
      return div(`.result-cost`, [`Paid`])
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


export function renderStageTime(stage_time) {
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

export function renderPerformerLimit(performer_limit) {
//console.log(performer_limit)
  if (performer_limit) {
    
    const {type, data} = performer_limit
    if (type === "booked_plus_walkin") {
      return div(`.result-performer-limit`, [
        `${data.booked} booked, ${data.walk_in} walk-in`
      ])
    } else {
      return div(`.result-performer-limit`, [
        (type === "limit" ? data.limit : `${data.min}-${data.max}`) + ' people'
      ])
    }
  }
  return null
}

export function renderDonde(donde) {
  return div(`.result-donde`, [
    div(`.name`, [donde.name]),
    div(`.street`, [donde.street]),
    div(`.city`, [donde.city])
  ])
}

export function renderStatus(cuando) {
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

export function renderSignUpStart(cuando, sign_up) {
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

export function renderSignup(cuando, sign_up) {
  if (sign_up) {
    //console.log(sign_up)
    return div(`.result-sign-up`, [
      renderSignUpStart(cuando, sign_up),
      renderSignUpMethods(sign_up)
    ])
  }

  return null

}

function renderWebsite(website) {
  const site = `http://${website}`
  return div(`.result-website`, [
    a({attrs: {href: site}}, [`Website`])
  ])
}

function renderEmail(email, email_name) {
  return div(`.result-email`, [
    a(`.email-address`, {attrs: {href: `mailto:${email}`}}, [email]),
    email_name ? span(`.email-name`, [`(${email_name})`]) : null
  ])
}

export function renderContactInfo(contacts) {
  if (contacts) {
    const {email, email_name, website} = contacts

    return div(`.result-contact-info`, [
      email ? renderEmail(email, email_name) : null,
      website ? renderWebsite(website) : null
    ])
  }
  return null
}

export function renderHostInfo(hosts) {
  if (hosts) {
    return div(`.result-host-info`, [hosts])
  }

  return null
}

export function renderNote(note) {
  if (note) {
    //console.log(sign_up)
    return div(`.result-note`, [
      div(`.result-note`, [note ])
    ])
  }

  return null

}