import {Observable as O} from 'rxjs'
import {between, notBetween} from '../../utils'

export default function intent(sources) {
  const {DOM} = sources

  const itemClick$ = DOM.select('.appSelectable').events('click').map(ev => {
     return ev.target.dataset.date
   })

  const nextMonth$ = DOM.select('.appNextMonth').events('click')
  const prevMonth$ = DOM.select('.appPrevMonth').events('click')

  const changeMonth$ = O.merge(nextMonth$.mapTo(1), prevMonth$.mapTo(-1))

  const clear$ = DOM.select(`.appClear`).events(`click`)

  return {
    itemClick$,
    changeMonth$,
    clear$
  }
}
