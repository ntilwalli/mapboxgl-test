import {Observable as O} from 'rxjs'
import {button} from '@cycle/dom'

export default function main(sources, inputs) {
  return {
    DOM: O.of(button('.appBrandButton.hopscotch-icon.btn.btn-link.nav-brand', {}, [])),
    output$: sources.DOM.select('.appBrandButton').events('click')
  }
}