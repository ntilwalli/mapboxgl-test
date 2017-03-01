import {Observable as O} from 'rxjs'
import {img} from '@cycle/dom'

export default function main(sources, inputs) {
  return {
    DOM: inputs.props$((props: any) => img({
      attrs: {href: props.href || '/images/profile_pic_placeholder.png'},
      style: {
        width: "5rem",
        height: "5rem"
      }
    }, []))
  }
}