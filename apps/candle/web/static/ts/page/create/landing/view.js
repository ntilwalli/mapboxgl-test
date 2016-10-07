import {Observable as O} from 'rxjs'
import {h1, h2, h3, h4, h5, h6, nav, ul, li, div, a, i, span, button, input, img} from '@cycle/dom'
import {attrs, combineObj} from '../../../utils'
import {renderBasic} from '../helpers'

function renderStep1(state) {
  return div([
    h6(`Step 1`),
    h4(`Start with the basics`),
    h6(`Event type, where, when, title, description...`),
    input(`.appContinueStep1Button`, {
      attrs: {
        type: `button`,
        value: `Continue`
      }
    })
  ])
}

function renderHeading() {
  return div(`.create-listing-heading`, [
    h2(`Host a new event`),
    div(`Start off by creating a listing page which will be the profile page for your event or event group!`)
  ])
}

function renderPanel(state) {
  if (state.waiting) {
    return div(`.panel.modal`, [`Waiting`])
  } else {
    return div(`.input-section`, [
      div(`.form-section`, [
        div(`.empty-section`),
        div(`.content-section`, [
          div(`.panel`, [
            renderHeading(),
            renderStep1(state)
          ])
        ])
      ])
    ])
  }
}

function renderImage() {
  return div(`.image-section`, [
    img(`.image-element`, {attrs: {src:`/images/floralMicrophone.svg`}})
  ])
}

export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)}).map(inputs => {
    const {state, components} = inputs
    const {heading} = components
    if (state.waiting) {
      return div(`.create-panel.waiting`, [`Waiting`])
    } else {
      return div(`.create-panel.create-landing`, [
        heading,
        renderBasic(renderPanel(state), renderImage()),
      ])
    }
  })
}
