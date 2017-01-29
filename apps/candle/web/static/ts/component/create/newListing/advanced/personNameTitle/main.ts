import {div, span} from '@cycle/dom'
import {TextInputComponent} from '../helpers'
import {combineObj} from '../../../../../utils'

export default function main(sources, inputs) {
  const name = TextInputComponent(
    sources, 
    inputs.props$.pluck('data').pluck('name'), 
    inputs.component_id,
    {
      placeholder: `Name`,
      name: `name-input`,
      styleClass: `.name-input.form-control`,
      emptyIsError: true
    })

  const title = TextInputComponent(
    sources, 
    inputs.props$.pluck('data').pluck('title'), 
    inputs.component_id,
    {
      placeholder: `Title (optional)`,
      name: `title-input`,
      styleClass: `.name-input.form-control`,
      emptyIsError: false
    })  

  const vtree$ = combineObj({
    name: name.DOM, 
    title: title.DOM
  }).map((info: any) => {
    const {name, title} = info
    return div('.row', [
      div('.col-12.raw-line', [
        div('.mr-xs', [name]),
        title
      ])
    ])
  })

  const output$ = combineObj({
    name: name.output$, 
    title: title.output$
  }).map((info: any) => {
    const {name, title} = info
    const errors = name.errors.concat(title.errors)
    const valid = name.valid && title.valid
    return {
      data: {
        name: name.data,
        title: title.data
      },
      valid,
      errors
    }
  })
  
  return {
    DOM: vtree$,
    output$: output$.map(x => {
      return {
        data: x,
        index: inputs.component_index
      }
    })
  }
}