import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../../utils'
import {CategoryTypes, ComedyTypes} from '../../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has} from '../../../../helpers/listing/utils'

function intent(sources) {
  const {DOM} = sources
  
  const comedy_type$ = DOM.select('.appComedyTypeInput').events('click')
    .map(fromCheckbox)

  const category$ = DOM.select('.appComedyInput').events('click') 

  return {
    comedy_type$,
    category$
  }
}

function reducers(actions, inputs) {
  const comedy_type_r = actions.comedy_type$.map(msg => state => {
    return state.update('categories', (categories: any) => {
      const new_categories = categories.toJS()
      return Immutable.fromJS(processCheckboxArray(msg, new_categories))
    })
  })

  const category_r = actions.category$.map(msg => state => {
    const new_state = state.update('active', val => !val)
    const active = new_state.get('active')
    // if (active) {
    //   const new_categories = Object.keys(ComedyTypes).map(x => ComedyTypes[x])
    //   return new_state.set('categories', Immutable.fromJS(new_categories))
    // } else {
      return new_state.set('categories', Immutable.fromJS([]))
    //}
  })

  return O.merge(comedy_type_r, category_r)
}

const findComedy = x => x.indexOf('/comedy') === 0

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(props => {
      const active = props.some(findComedy)
      const categories = props.filter(findComedy)
        .map(cat => {
          const out = cat.split('/').filter(Boolean)
          if (out.length === 2) {
            return out[1]
          } else {
            return undefined
          }
        }).filter(Boolean)

      console.log('props categories', categories)

      return reducer$
        .startWith(Immutable.fromJS({categories, active}))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    const {active, categories} = state
    const stand_up = has(categories, ComedyTypes.STAND_UP)
    const sketch = has(categories, ComedyTypes.SKETCH)
    const improv = has(categories, ComedyTypes.IMPROV)

    return div([
      div('.form-check.form-check-inline', [
        label('.form-check-label', [
          input('.appComedyInput.form-check-input', {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.COMEDY, checked: active}}, []),
          span('.ml-xs', ['comedy'])
        ]),
      ]),
      active ? div('.ml-4', {class: {'read-only': !active}}, [
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appComedyTypeInput.form-check-input`, {props: {checked: stand_up}, attrs: {type: 'checkbox', name: 'comedy_categories', value: ComedyTypes.STAND_UP, checked: stand_up}}, []),
            span('.ml-xs', ['stand-up'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appComedyTypeInput.form-check-input`, {props: {checked: sketch}, attrs: {type: 'checkbox', name: 'comedy_categories', value: ComedyTypes.SKETCH, checked: sketch}}, []),
            span('.ml-xs', ['sketch'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appComedyTypeInput.form-check-input`, {props: {checked: improv}, attrs: {type: 'checkbox', name: 'comedy_categories', value: ComedyTypes.IMPROV, checked: improv}}, []),
            span('.ml-xs', ['improv'])
          ])
        ])
      ]) : null
    ])
  })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const vtree$ = view(state$)


  return {
    DOM: vtree$,
    output$: state$
      .map((state: any) => {
        if (state.categories.length === 0) {
          return Object.keys(ComedyTypes).map(x => '/comedy/' + ComedyTypes[x])
        } else {
          return state.categories.map(x => '/comedy' + x)
        }
      })
      .publishReplay(1).refCount()
  }
}