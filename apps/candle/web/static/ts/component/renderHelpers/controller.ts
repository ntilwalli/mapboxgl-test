import {div, button, span, a, i} from '@cycle/dom'

export function renderMenuButton() {
  return i(`.appShowMenuButton.menu-button.fa.fa-bars.fa-1-2x`, [])
}

export function renderUserProfileButton() {
  return i(`.user-profile-button.fa.fa-user-o.fa-1-2x`, {class: {appShowUserProfileButton: true}}, [])
}

export function renderSearchCalendarButton() {
  return i(`.user-profile-button.fa.fa-calendar.fa-1-2x`, {class: {appShowSearchCalendarButton: true}}, [])
}

export function renderLoginButton() {
   return button(`.auth-button`, {class: {appShowLoginButton: true}}, [`Login`])
}
