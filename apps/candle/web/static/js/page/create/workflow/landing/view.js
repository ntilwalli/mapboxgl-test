import xs from 'xstream'
import {h1, h2, h3, h4, h5, h6, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import {attrs} from '../../../utils'
import combineObj from '../../../combineObj'


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
      // , div(`.controller-section`, [
      //   div(`.separator`),
      //   div(`.button-section`, [
      //     a(`.appBackButton.back-button`, {attrs: {href: `/create/${parentState.id}`? state.backUrl : `#`}}, [
      //       span(`.fa.fa-angle-left`),
      //       span(`.back-text`, [`Back`])
      //     ]),
      //     a(`.appNextButton.next-button`, {attrs: {href: `/create/`(state && state.nextUrl) ? state.nextUrl : `#`}}, [
      //       span(`.next-text`, [`Next`]),
      //       span(`.fa.fa-angle-right`)
      //     ])
      //   ])
      // ])
    ])
  }
}

export default function view(state$) {
  return state$.map(state => {
    return state.waiting ? div(`.panel.modal`, [`Waiting`]) :
      renderPanel(state)
  })
}
