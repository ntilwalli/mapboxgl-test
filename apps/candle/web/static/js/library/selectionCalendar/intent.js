import {Observable as O} from 'rxjs'
import {between, notBetween} from '../../utils'

export default function intent(sources) {
  const {DOM} = sources

  const itemClick$ = DOM.select('.appSelectable').events('click').map(ev => {
     return ev.target.dataset.date
   })


  return {
    itemClick$
  }
}
