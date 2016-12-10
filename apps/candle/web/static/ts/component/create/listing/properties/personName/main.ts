import {TextInputComponent} from '../helpers'

export default function main(sources, inputs) {
  const out = TextInputComponent(
    sources, 
    inputs.props$.pluck('data'), 
    inputs.component_id + ': Invalid name',
    {
      placeholder: `Name`,
      name: `name-input`,
      styleClass: `.name-input`,
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
