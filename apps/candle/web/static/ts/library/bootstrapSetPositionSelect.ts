import {Observable as O} from 'rxjs'
import {div, select, option, label, input, span} from '@cycle/dom'
import {SetPositionTypes} from '../listingTypes'

export default function main(sources, props$) {
  const shared$ = props$.publishReplay(1).refCount()
  return {
    DOM: shared$.map(props => {
      //return div('.row', [
      //  div('.col-12', [
          return select(
            `.appSetPositionInput.form-control.form-control`, 
            {style: {width: "5rem"}},
            Object.keys(SetPositionTypes).map(key => {
              const val = SetPositionTypes[key]
              return option({attrs: {value: SetPositionTypes[key], selected: props === val}}, [
                key.substring(0, 1).toUpperCase() + key.substring(1).toLowerCase()
              ])
            })
          )
        //])
      //])
    }),
    output$: O.merge(
      shared$.map(props => {
        return props || SetPositionTypes.FIRST
      }), 
      sources.DOM.select('.appSetPositionInput').events('change').map(ev => parseInt(ev.target.value))
    )
  }
}