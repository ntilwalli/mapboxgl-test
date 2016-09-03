import {div, h5} from '@cycle/dom'
import {isOptional} from './listing'

export function renderHeading(val, section, property, listing) {
  const optional = section ? isOptional(section, property, listing) : false
  return div(`.panel-title`, [
    h5([`${val}${optional ? ' (optional)': ''}`])
  ])
}

export function renderBasic(content, image) {
  return div(`.content-body`, [
    div(`.left-side`, [
      content
    ]),
    div(`.right-side`, [
      image
    ])
  ])
}

export function renderWithInstruction(content, instruction) {
  return div(`.content-body`, [
    div(`.left-side`, [
      content,
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
      instruction
    ])
  ])
}