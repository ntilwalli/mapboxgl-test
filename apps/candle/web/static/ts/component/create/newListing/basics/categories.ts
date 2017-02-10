import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../utils'
import {CategoryTypes} from '../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has} from '../../../helpers/listing/utils'

function applyChange(session, val) {
  session.listing.meta.categories = val
}

export default function main(sources, inputs) {

  const reducer$ = sources.DOM.select('.appCategoriesInput').events('click')
    .map(fromCheckbox)
    .map(msg => state => {
      return state.update('categories', (categories: any) => {
        //console.log(`category`, val)
        const new_categories = categories.toJS()
        return Immutable.fromJS(processCheckboxArray(msg, new_categories))
      })
    })

  const categories$ = inputs.session$
    .map((session: any) => {
      return session.listing.meta.categories
    })
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
            input(`.appCategoriesInput.form-check-input`, {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.COMEDY, checked: has(categories, CategoryTypes.COMEDY)}}, []),
            span('.ml-xs', ['comedy'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appCategoriesInput.form-check-input`, {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.MUSIC, checked: has(categories, CategoryTypes.MUSIC)}}, []),
            span('.ml-xs', ['music'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appCategoriesInput.form-check-input`, {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.SPOKEN_WORD, checked: has(categories, CategoryTypes.SPOKEN_WORD)}}, []),
            span('.ml-xs', ['spoken-word'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appCategoriesInput.form-check-input`, {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.STORYTELLING, checked: has(categories, CategoryTypes.STORYTELLING)}}, []),
            span('.ml-xs', ['storytelling'])
          ])
        ])
      ])
    })

  return {
    DOM: vtree$,
    output$: categories$.map(categories => {
      return {
        data: categories,
        apply: applyChange,
        valid: true,
        errors: []
      }
    }).publishReplay(1).refCount()
  }
}