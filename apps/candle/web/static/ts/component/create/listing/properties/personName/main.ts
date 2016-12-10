import {TextInputComponent} from '../helpers'

export default function main(sources, inputs) {
  const out = TextInputComponent(
    sources, 
    inputs.props$, 
    inputs.component_id + ': Invalid name',
    {
      placeholder: `Type name`,
      name: `name-input`,
      styleClass: `.name-input`,
      emptyIsError: false
    })
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
