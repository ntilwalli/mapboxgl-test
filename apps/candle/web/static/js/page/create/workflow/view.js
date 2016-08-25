import xs from 'xstream'
import {h1, h2, h3, h4, h5, h6, nav, ul, li, div, a, i, span, button, input, img, svg} from '@cycle/dom'
import {attrs} from '../../utils'
import combineObj from '../../combineObj'

export default function view(state$, components$) {
  return combineObj({state$, components$}).map(({state, components}) => {
    return div(`.workflow-container`, [
      div(`.appModalBackdrop.modal-backdrop${state.showInstruction ? '.show' : ''}`),
      components.heading,
      div(`.content-body`, [
        div(`.left-side`, [
          components.form,
          components.instruction ? (!state.showInstruction ? div(`.appOpenInstruction.instruction-section.hide`, [
            span(`.icon.fa.fa-lightbulb-o`)
          ]) :
          div(`.instruction-section.show`, [
            span(`.appCloseInstruction.close-icon`),
            span(`.icon.fa.fa-lightbulb-o`),
            components.instruction
          ])) : null
        ]),
        div(`.right-side`, [
          components.instruction ? div(`.instruction-section`, [
            div([
              span(`.icon.fa.fa-lightbulb-o`),
              components.instruction
            ])
          ]) : (components.image ? components.image : null)
          // div(`.image-section`, [
          //   img(`.image-element`, {attrs: {src:`/images/floralMicrophone.svg`}})
          // ])
          // div(`.instruction-section`, [
          //   `Hello`
          // ])
        ])
      ])
    ])
  })
}
//     ])
//   })
// }
