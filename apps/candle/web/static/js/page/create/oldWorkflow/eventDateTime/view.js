import xs from 'xstream'
import {h, h3, h4, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import combineObj from 'xs-combine-obj'
import {attrs} from '../../../utils'


function renderHeading(val) {
  return div(`.panel-title`, [h4([val])])
}

function renderInput(state) {
  return div(`.date-picker.sub-section`, [
    input(`.appDateInput.date-input`, {props: {type: `text`}})
  ])
}

function renderPanel(inputs) {
  const {state, components} = inputs

  if (state.waiting) {
    return div(`.panel.modal`, [`Waiting`])
  } else {
    const isDisabled = !(state.listing  && state.listing.name && state.listing.name.length > 0)
    const typeString = state.listing.type === `group` ? `event group` : `event`
    console.log(`Not waiting, rendering time`)
    return div(`.input-section`, [
      div(`.form-section`, [
        div(`.empty-section`),
        div(`.content-section`, [
          div(`.panel`, [
            renderHeading(`When is it?`),
            components.startDate
          ])
        ])
      ])
      , div(`.controller-section`, [
        div(`.separator`),
        div(`.button-section`, [
          button(`.appBackButton.back-button`, [
            span(`.fa.fa-angle-left`),
            span(`.back-text`, [`Back`])
          ]),
          //button(`.appNextButton.next-button${state.listing  && state.listing.type ? '' : '.disabled'}`, [
          button(`.appNextButton.next-button${isDisabled ? '.disabled' : ''}`, [
            span(`.next-text${isDisabled ? '.disabled' : ''}`, [`Next`]),
            span(`.fa.fa-angle-right${isDisabled ? '.disabled' : ''}`)
          ])
        ])
      ])
    ])
  }
}

// export default function view({state$, components}) {
//   return combineObj({state$, components: combineObj(components)}).map(info => {
//     return state.waiting ? div(`.panel.modal`, [`Waiting`]) :
//       renderPanel(state)
//   })
// }


export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)}).map(inputs => {
    return renderPanel(inputs)
  })
}
