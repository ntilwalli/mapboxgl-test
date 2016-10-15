import {Observable as O} from 'rxjs'
import {h, h3, h4, h5, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {attrs, combineObj} from '../../../utils'
import {isDisabled, isOptional} from '../listing'
import {renderHeading} from '../helpers'


function renderCreationType(info) {
  const {state, components} = info
  const {listing} = state
  const {creationTypeInput} = components
  const section = `listing`
  const property = `type`
  const disabled = isDisabled(section, property, listing)
  if (!disabled) {
    return div(`.creation-type`, [
      renderHeading(`What type of listing is this?`, section, property, listing),
      creationTypeInput
    ])
  } else {
    return null
  }
}

function renderVisibility(info) {
  const {state, components} = info
  const {listing} = state
  const {visibilityInput} = components
  const section = `meta`
  const property = `visibility`
  const disabled = isDisabled(section, property, listing)

  if (!disabled) {
    return div(`.visibility`, [
      renderHeading(`Search visibility?`, section, property, listing),
      visibilityInput
    ])
  } else {
    return null
  }
}

function renderEventType(info) {
  const {state, components} = info
  const {listing} = state
  const {eventTypeInput} = components
  const section = `meta`
  const property = `event_type`
  const disabled = isDisabled(section, property, listing)
  if (!disabled) {
    return div(`.event-type`, [
      renderHeading(`Type of event?`, section, property, listing),
      eventTypeInput
    ])
  } else {
    return null
  }
}

function renderPanel(info) {
  return div(`.panel`, [
    renderCreationType(info),
    renderVisibility(info),
    renderEventType(info)
  ])
}

export default function view(state$, components) {
  return combineObj(components).withLatestFrom(state$, (components, state: any) => {
    const info = {components, state}
    return state.waiting ? div(`.panel.modal`, [`Waiting`]) : renderPanel(info)
  })
}
