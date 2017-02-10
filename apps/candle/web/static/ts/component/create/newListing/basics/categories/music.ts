import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../../utils'
import {MusicTypes} from '../../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has} from '../../../../helpers/listing/utils'


export default function main(sources, inputs) {

  const reducer$ = sources.DOM.select('.appMusicTypeInput').events('click')
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
            input(`.appMusicTypeInput.form-check-input`, {attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.HIP_HOP, checked: has(categories, MusicTypes.HIP_HOP)}}, []),
            span('.ml-xs', ['hip-hop'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appMusicTypeInput.form-check-input`, {attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.ROCK, checked: has(categories, MusicTypes.ROCK)}}, []),
            span('.ml-xs', ['rock'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appMusicTypeInput.form-check-input`, {attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.COUNTRY, checked: has(categories, MusicTypes.COUNTRY)}}, []),
            span('.ml-xs', ['country'])
          ])
        ])
      ])
    })

  return {
    DOM: vtree$,
    output$: categories$
      .map(x => x.map(x => '/music/' + x))
      .publishReplay(1).refCount()
  }
}