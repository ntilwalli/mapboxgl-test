import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy} from '../../../../../utils'
import clone = require('clone')

import Cost from  '../cost/main'
import {getDefault as costDefault} from '../cost/main'
import {default as TierBenefit, getDefault as getTierBenefitDefault} from '../tierBenefit/main'
import {default as TierCost, getDefault as getTierCostDefault} from '../tierCost/main'
// How to use: include 'itemHeading', 'item' and 'itemDefault' in inputs object
//{...inputs, sectionHeading: 'Stage time', itemHeading: 'Host', item: some component, itemDefault: some component value default function}

function render(state, component_id, item_heading) {
  let children
  if (state.length === 0) {
    children = ['Click plus to add item']
  } else if (state.length === 1) {
    children = state
  } else {
    children = state.map((x, index) => div('.column', [
      div('.row', [
        span('.sub-sub-heading.item', [`${item_heading} ${index + 1}`]), 
        span('.appCostCollectionSubtractButton.list-button.fa.fa-minus', {attrs: {'data-index': index}}, [])
      ]),
      div('.item.indented', [x])
    ]))
  }

  return div('.column', [
    div('.row', [
      div('.sub-heading.section-heading', [component_id]),
      button('.appCostCollectionAddButton.list-button.item.flex.align-center.fa.fa-plus', [])
    ]),
    div('.column', children)
  ])
}

function intent(sources) {
  const {DOM} = sources

  return {
    add$: DOM.select('.appCostCollectionAddButton').events('click'),
    subtract$: DOM.select('.appCostCollectionSubtractButton').events('click').map(ev => {
      return parseInt(ev.target.dataset['index'])
    })
  }
}

function add_structure(x) {
  return {
    data: x,
    errors: [],
    valid: true
  }
}

function reducers(actions, inputs) {
  const add_r = actions.add$.map(_ => state => {
    return state.push(Immutable.fromJS(add_structure(getTierCostDefault())))
  })

  const subtract_r = actions.subtract$.map(index => state => {
    return state.delete(index)
  })

  const change_r = inputs.change$.map(msg => state => {
    const out = state.set(msg.index, Immutable.fromJS(msg.data))
    return out
  })

  return O.merge(add_r, subtract_r, change_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(props => {
      // should be
      const init = props ? props.map(add_structure) : [getTierCostDefault()].map(add_structure)//[getDefault()]

      return reducer$.startWith(Immutable.fromJS(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`costCollection state`, x))
    .publishReplay(1).refCount()
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const change$ = createProxy()
  const state$ = model(actions, {...inputs, change$})

  const components$ = state$
    .distinctUntilChanged((x, y) => x.length === y.length)
    .map(state => {
      //const state = JSON.parse(JSON.stringify(my_state));
      const components = state.map((props, index) => {
        return isolate(TierCost)(sources, {...inputs, props$: O.of(props.data), component_index: index})
      })
      
      const components_dom = components.map(x => x.DOM)
      const components_output = components.map(x => x.output$)

      return {
        DOM: O.combineLatest(...components_dom),
        output$: O.merge(...components_output)
      }
    }).publishReplay(1).refCount()

  const components_dom$ = components$.switchMap(x => x.DOM)
  const components_output$ = components$.switchMap(x => x.output$)

  change$.attach(components_output$)

  const vtree$ = components_dom$.map(x => render(x, inputs.component_id, inputs.item_heading))

  return {
    DOM: vtree$,
    output$: state$.map(state => {
      return {
        data: state.map(x => x.data),
        valid: state.every(x => x.valid === true),
        errors: state.reduce((acc, item) => acc.concat(item.errors), [])
      }
    })
  }
}
