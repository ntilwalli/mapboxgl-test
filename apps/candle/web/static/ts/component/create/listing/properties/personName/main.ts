import {NameInputComponent} from '../helpers'

export default function main(sources, inputs) {
  const out = NameInputComponent(sources, inputs.props$, inputs.component_id + ': Invalid name')
  return {
    DOM: out.DOM,
    output$: out.output$.map(x => {
      return {
        data: x,
        index: inputs.component_index
      }
    })
  }
}
