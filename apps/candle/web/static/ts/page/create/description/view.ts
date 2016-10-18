import {Observable as O} from 'rxjs'
import {textarea, h3, h4, h5, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {combineObj} from '../../../utils'
import {renderHeading} from '../helpers'
import {isDisabled} from '../listing'

function renderTitle(info) {
  const {state, components} = info
  const {session} = state
  const {listing} = session
  const {profile} = listing
  const {titleInput} = components
  const section = `description`
  const property = `profile/title`
  // const disabled = isDisabled(section, property, listing)
  // if (!disabled) {
    return div(`.title`, [
      renderHeading(`Title`, section, property, listing),
      titleInput
    ])
  // } else {
  //   return null
  // }
}

function renderDescription(state) {
  const {session} = state
  const {listing} = session
  const {profile} = listing
  const {description} = profile
  const section = `description`
  const property = `profile/description`
  // const disabled = isDisabled(section, property, listing)
  // if (!disabled) {
    return div(`.description`, [
      renderHeading(`Description`, section, property, listing),
      textarea(`.appDescriptionInput`, {props: {rows: 5}}, [description || ``])
    ])
  // } else {
  //   return null
  // }
}

function renderShortDescription(state) {
  const {session} = state
  const {listing} = session
  const {profile} = listing
  const {short_description} = profile
  const section = `description`
  const property = `profile/short_description`
  const disabled = isDisabled(section, property, listing)
  if (!disabled) {
    return div(`.short-description`, [
      renderHeading(`Short description`, section, property, listing),
      textarea(`.appShortDescriptionInput`, {props: {rows: 2}}, [short_description || ``])
    ])
  } else {
    return null
  }
}

function renderCategories(state) {
  const {session} = state
  const {listing} = session
  const {profile} = listing
  const {categories} = profile
  const section = `description`
  const property = `profile/categories`
  const disabled = isDisabled(section, property, listing)
  if (!disabled) {
    return div(`.categories`, [
      renderHeading(`Categories`, section, property, listing),
      input(
        `.appCategoriesInput.form-control`, 
        {props: {type: `text`, value: categories.join(`, `)}}) 
      ])
  } else {
    return null
  }
}

function renderPanel(info) {
  const {state} = info
  return div(`.panel`, [
    renderTitle(info),
    renderDescription(state),
    renderShortDescription(state),
    renderCategories(state)
  ])
}

export default function view(state$, components) {
  return state$.withLatestFrom(combineObj(components), (state, components) => {
    const info = {state, components}
    return state.waiting ? div(`.panel.modal`, [`Waiting`]) : renderPanel(info)
  })
}
