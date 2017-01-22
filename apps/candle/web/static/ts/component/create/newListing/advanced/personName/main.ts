import {TextInputComponent} from '../helpers'

export default function main(sources, inputs) {
  const out = TextInputComponent(
    sources, 
    inputs.props$.pluck('data'), 
    inputs.component_id,
    {
      placeholder: `Name`,
      name: `name-input`,
      styleClass: `.name-input.form-control-sm`,
      emptyIsError: true
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
