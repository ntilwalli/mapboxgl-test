import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../../utils'
import {CategoryTypes, ComedyTypes} from '../../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has} from '../../../../helpers/listing/utils'

function intent(sources) {
  const {DOM} = sources
  
  const check$ = DOM.select('.appCheckInput').events('click')
    .map(fromCheckbox)

  return {
    check$
  }
}

function reducers(actions, inputs) {
  const check_r = actions.check$.map(msg => state => {
    return state.update('categories', (categories: any) => {
      const new_categories = categories.toJS()
      return Immutable.fromJS(processCheckboxArray(msg, new_categories))
    })
  })

  return O.merge(check_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    props$: inputs.props$,
    initial_state$: inputs.initial_state$
  })
    .switchMap((info: any) => {
      const {props, initial_state} = info
      const categories = initial_state.filter(props.finder)
        .map(cat => {
          const out = cat.split('/').filter(Boolean)
          if (out.length === 2) {
            return out[1]
          } else {
            return undefined
          }
        }).filter(Boolean)

      return reducer$
        .startWith(Immutable.fromJS({categories, base: props.base}))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    const {categories, base} = state

    const children = Object.keys(base).map(key => {
      const value = base[key]
      const checked = has(categories, value)
      
      return div('.form-check.form-check-inline', [
        label('.form-check-label', [
          input(`.appCheckInput.form-check-input`, {props: {checked}, attrs: {type: 'checkbox', name: 'categories', value, checked}}, []),
          span('.ml-xs', [value.replace(/_/g, '-')])
        ])
      ])
    })

    return div('.ml-4', children)
  })
}

export default function main(sources, inputs) {
  const shared_props$ = inputs.props$.publishReplay(1).refCount()
  const actions = intent(sources)
  const state$ = model(actions, {...inputs, props$: shared_props$})

  const vtree$ = view(state$)


  return {
    DOM: vtree$,
    output$: state$
      .withLatestFrom(shared_props$, (state: any, props: any) => {
      //   if (state.categories.length === 0) {
      //     return Object.keys(props.base).map(key => '/' + props.parent_category + '/' + props.base[key])
      //   } else {
          return state.categories.map(cat => '/' + props.parent_category + '/' + cat)
      //  }
      })
      .publishReplay(1).refCount()
  }
}