import {div, button, span, a, i} from '@cycle/dom'

export function renderMenuButton() {
  return i(`.menu-button.fa.fa-bars.fa-1-2x`, {class: {appShowMenuButton: true}}, [])
}

export function renderUserProfileButton() {
  return i(`.user-profile-button.fa.fa-user-o.fa-1-2x`, {class: {appShowUserProfileButton: true}}, [])
}

export function renderSearchCalendarButton() {
  return i(`.one-day-search-button.fa.fa-calendar.fa-1-2x`, {class: {appShowSearchCalendarButton: true}}, [])
}

export function renderLoginButton() {
  return button(`.auth-button`, {class: {appShowLoginButton: true}}, [`Login`])
}

// export function renderLoadingSpinner() {
//   return div([
//     div(
//     `.loader-small`, 
//     [])
//   ])
// }

export function renderCircleSpinner() {
  return div(`.sk-circle`, [
    div(`.sk-circle1.sk-child`, []),
    div(`.sk-circle2.sk-child`, []),
    div(`.sk-circle3.sk-child`, []),
    div(`.sk-circle4.sk-child`, []),
    div(`.sk-circle5.sk-child`, []),
    div(`.sk-circle6.sk-child`, []),
    div(`.sk-circle7.sk-child`, []),
    div(`.sk-circle8.sk-child`, []),
    div(`.sk-circle9.sk-child`, []),
    div(`.sk-circle10.sk-child`, []),
    div(`.sk-circle11.sk-child`, []),
    div(`.sk-circle12.sk-child`, [])
  ])
}
