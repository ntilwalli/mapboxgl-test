import xs from 'xstream'
import {h, h3, h4, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import combineObj from '../../../combineObj'
import {attrs} from '../../../utils'


function renderHeading(val) {
  return div(`.panel-title`, [h4([val])])
}

function renderPanel(state) {
  if (state.waiting) {
    return div(`.panel.modal`, [`Waiting`])
  } else {
    const isDisabled = !(state.listing  && state.listing.name && state.listing.name.length > 0)
    const typeString = state.listing.type === `group` ? `event group` : `event`
    return div(`.input-section`, [
      div(`.form-section`, [
        div(`.empty-section`),
        div(`.content-section`, [
          div(`.panel`, [
            renderHeading(`What is the name of your ${typeString}?`),
            input(`.appNameInput`, {
              props: {
                type: `text`,
                placeholder: `Enter ${typeString} name here`,
                value: state.listing.name && state.listing.name.length ? state.listing.name : ``
              }
            })
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


export default function view(state$) {
  return state$.map(state => {
    return state.waiting ? div(`.panel.modal`, [`Waiting`]) : renderPanel(state)
  })
}
