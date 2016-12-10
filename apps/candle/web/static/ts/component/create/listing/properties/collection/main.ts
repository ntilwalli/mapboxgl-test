import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy} from '../../../../../utils'
import clone = require('clone')


// How to use: include 'itemHeading', 'item' and 'itemDefault' in inputs object
//{...inputs, sectionHeading: 'Stage time', itemHeading: 'Host', item: some component, itemDefault: some component value default function}

function render(state, component_id) {
  let children
  if (state.length === 0) {
    children = ['Click plus to add item']
  } else {
    children = state.map((x, index) => div('.column', [
      div('.row', [
        div('.item', [x]),
        span('.appSubtractButton.list-button.fa.fa-minus', {attrs: {'data-index': index}}, [])
      ])
    ]))
  }

  return div('.column', [
    div('.row', [
      div('.sub-heading.section-heading', [component_id]),
      button('.appAddButton.list-button.item.flex.align-center.fa.fa-plus', [])
    ]),
    div('.column', children)
  ])
}

function intent(sources) {
  const {DOM} = sources

  return {
    add$: DOM.select('.appAddButton').events('click'),
    subtract$: DOM.select('.appSubtractButton').events('click').map(ev => {
      return parseInt(ev.target.dataset['index'])
    })
  }
}

function reducers(actions, inputs) {
  const add_r = actions.add$.map(_ => state => {
    return state.push(Immutable.fromJS(inputs.itemDefault()))
  })

  const subtract_r = actions.subtract$.map(index => state => {
    const out = state.delete(index)
    const blah = out.toJS()
    return out
  })

  const change_r = inputs.change$.map(msg => state => {
    return state.set(msg.index, Immutable.fromJS(msg.data))
  })

  return O.merge(add_r, subtract_r, change_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(props => {
      // should be
      const init = props ? props.map(x => ({
        data: x,
        errors: [],
        valid: true
      })) : inputs.initEmpty ? [] : [inputs.initDefault ? inputs.initDefault() : inputs.itemDefault()]

      return reducer$.startWith(Immutable.fromJS(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => {
      return x.toJS()
    })
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const change$ = createProxy()
  const state$ = model(actions, {...inputs, change$})

  const components$ = state$
    .map(x => clone(x))
    .distinctUntilChanged((x, y) => {
      return x.length === y.length
    })
    .map(state => {
      const components = state.map((props, index) => {
        return isolate(inputs.item)(sources, {...inputs, props$: O.of(props.data), component_index: index})
      })
      
      const components_dom = components.map(x => x.DOM)
      const components_output = components.map(x => x.output$)
      const length = components.length

      return {
        DOM: length ? O.combineLatest(...components_dom) : O.of([]),
        output$: length ? O.merge(...components_output) : O.never()
      }
    }).publishReplay(1).refCount()

  const components_dom$ = components$.switchMap(x => x.DOM)
  const components_output$ = components$.switchMap(x => x.output$)

  change$.attach(components_output$)

  const vtree$ = components_dom$.map(x => {
    return render(x, inputs.component_id || 'Component id not supplied')
  })

  return {
    DOM: vtree$,
    output$: state$.map(state => {
      return state.length ? {
        data: state.map(x => {
          return x.data
        }),
        valid: state.every(x => x.valid === true),
        errors: state.reduce((acc, item) => acc.concat(item.errors), [])
      } : {data: [], valid: true, errors: []}
    })
  }
}
