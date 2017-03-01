import {Observable as O} from 'rxjs'
import {span} from '@cycle/dom'

export default function main(sources, inputs) {
  return {
    DOM: inputs.props$((props: any) => span('.appBackButton.fa.fa-arrow-left', {
      style: {
        width: "1rem",
        height: "1rem"
      }
    }, [])),
    output$: sources.DOM.select('.appBackButton').events('click')
  }
}