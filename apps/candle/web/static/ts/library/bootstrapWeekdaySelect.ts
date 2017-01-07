import {Observable as O} from 'rxjs'
import {div, select, option, label, input, span} from '@cycle/dom'
import {DayOfWeek} from '../listingTypes'

export default function main(sources, props$) {
  return {
    DOM: props$.map(props => {
      //return div('.row', [
      //  div('.col-12', [
          return select(
            `.appWeekdayInput.form-control.form-control-sm`, 
            {style: {width: "5rem"}},
            Object.keys(DayOfWeek).map(key => {
              const val = DayOfWeek[key]
              return option({attrs: {value: DayOfWeek[key], selected: props === val}}, [
                val.substring(0, 1).toUpperCase() + val.substring(1) 
              ])
            })
          )
        //])
      //])
    }),
    output$: O.merge(
      props$.map(props => props || DayOfWeek.SUNDAY), 
      sources.DOM.select('.appWeekdayInput').events('change').map(ev => ev.target.value)
    )
  }
}