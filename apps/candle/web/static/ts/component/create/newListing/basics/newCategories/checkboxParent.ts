import {Observable as O} from 'rxjs'
import {div, button, small, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify, traceStartStop} from '../../../../../utils'
import {CategoryTypes, ComedyTypes} from '../../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has} from '../../../../helpers/listing/utils'
import Subcategories from './subcategories'

function BlankComponent() {
  return {
    DOM: O.of(undefined),
    output$: O.of([])
  }
}

function intent(sources) {
  const {DOM} = sources
  
  const check$ = DOM.select('.appCategoryCheckInput').events('click')
    .publish().refCount() 

  const specific$ = DOM.select('.appSpecificButton').events('click')
    .publish().refCount() 


  return {
    check$,
    specific$
  }
}

function view(state$, props$, components) {
  return combineObj({
      state$,
      components: combineObj(components),
      props$
    }).map((info: any) => {
      const {state, components, props} = info
      const {checked, specific} = state
      return div([
        div('.d-flex', [
          div('.form-check.form-check-inline', [
            label('.form-check-label', [
              input('.appCategoryCheckInput.form-check-input', {props: {checked}, attrs: {type: 'checkbox', name: 'categories', value: props.parent_category, checked}}, []),
              span('.ml-xs', [props.parent_category.replace('_', '-')])
            ]),
          ]),
          props.base ? button('.appSpecificButton.btn.btn-link.d-flex.align-items-center.ml-4.mb-1', [small([!specific ? 'Be more specific' : 'Be less specific'])]) : null
        ]),
        specific ? components.subcategories : null
      ])
  })
}

function reducers(actions, inputs) {
  const specific_r = actions.specific$.map(_ => state => state.update('specific', x => !x))
  const check_r = actions.check$.map(_ => state => state.update('checked', x => !x))

  return O.merge(specific_r, check_r)
}

export default function main(sources, inputs) {
  const shared_initial_state$ = inputs.initial_state$.publishReplay(1).refCount()
  const shared_initial_checked$ = O.merge(
      inputs.initial_state$
        .withLatestFrom(inputs.props$, (state, props) => {
          return state.some(props.finder)
        }), 
      O.never()
    )
    .publishReplay(1).refCount()

  const shared_props$ = inputs.props$.publishReplay(1).refCount()

  const actions = intent(sources)
  const reducer$ = reducers(actions, inputs)
  const state$ = combineObj({
    props$: shared_props$,
    initial_state$: shared_initial_state$
  }).switchMap(({props, initial_state}: any) => {
    const cats = initial_state.filter(props.finder)
    const checked = cats.length > 0
    const length = props.base ? Object.keys(props.base).length : undefined
    let specific = false
    if (length && cats.length < length && cats.length > 0) {
      specific = true
    }
    return reducer$.startWith(Immutable.fromJS({checked, specific})).scan((acc, f: Function) => f(acc))
  })
  .map((x: any) => x.toJS())
  //.let(traceStartStop('checkboxParent trace'))
  .publishReplay(1).refCount()

  const subcategories$ = state$
    .map(x => {
      return x
    })
    .withLatestFrom(
      shared_props$.map(x => {
        return x
      }), 
      (active, props: any) => {
        if (active && props.base) {
          return isolate(Subcategories)(sources, {...inputs, props$: shared_props$})
        } else {
          return BlankComponent()
        }
      }
    ).publishReplay(1).refCount()

  //subcategories$.subscribe()
  const components = {
    subcategories$: subcategories$.switchMap(x => x.DOM)
  }

  const vtree$ = view(state$, shared_props$, components)

  return {
    DOM: vtree$,
    output$: combineObj({
        state$,
        subcategories$: subcategories$.switchMap(x => {
          return x.output$
        })
      })
      .withLatestFrom(
        shared_props$.map(x => {
          return x
        }),
        ((info: any, props: any) => {
          if (props.base) {
            if (!info.state.specific || info.subcategories.length === 0) {
              return Object.keys(props.base).map(key => '/' + props.parent_category + '/' + props.base[key])
            } else {
              return info.subcategories.map(category => '/' + props.parent_category + '/' + category)
            }
          } else {
            info.state.checked ? ['/' + props.parent_category] : []
          }
        })
      )
      .publishReplay(1).refCount()
  }
}