import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../../utils'
import {ComedyTypes} from '../../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has} from '../../../../helpers/listing/utils'


export default function main(sources, inputs) {

  const reducer$ = sources.DOM.select('.appComedyTypeInput').events('click')
    .map(fromCheckbox)
    .map(msg => state => {
      return state.update('comedy_categories', (categories: any) => {
        //console.log(`category`, val)
        const new_categories = categories.toJS()
        return Immutable.fromJS(processCheckboxArray(msg, new_categories))
      })
    })

  const categories$ = inputs.props$
    .switchMap(categories => {
      return reducer$.startWith(Immutable.fromJS({categories})).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS().categories)
    .publishReplay(1).refCount()


  const vtree$ = categories$
    .map(categories => {
      return div([
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appComedyTypeInput.form-check-input`, {attrs: {type: 'checkbox', name: 'comedy_categories', value: ComedyTypes.STAND_UP, checked: has(categories, ComedyTypes.STAND_UP)}}, []),
            span('.ml-xs', ['stand-up'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appComedyTypeInput.form-check-input`, {attrs: {type: 'checkbox', name: 'comedy_categories', value: ComedyTypes.SKETCH, checked: has(categories, ComedyTypes.SKETCH)}}, []),
            span('.ml-xs', ['sketch'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appComedyTypeInput.form-check-input`, {attrs: {type: 'checkbox', name: 'comedy_categories', value: ComedyTypes.IMPROV, checked: has(categories, ComedyTypes.IMPROV)}}, []),
            span('.ml-xs', ['improv'])
          ])
        ])
      ])
    })

  return {
    DOM: vtree$,
    output$: categories$
      .map(x => x.map(x => '/comedy/' + x))
      .publishReplay(1).refCount()
  }
}