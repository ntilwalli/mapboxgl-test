import {Observable as O} from 'rxjs'
import {img} from '@cycle/dom'

export default function main(sources, inputs) {
  return {
    DOM: inputs.props$((props: any) => img({
      attrs: {href: props.href},
      style: {
        position: "absolute",
        width: "100%",
        "min-height": "100%"
      }
    }, []))
  }
}