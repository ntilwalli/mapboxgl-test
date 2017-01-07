import {Observable as O} from 'rxjs'
import {div, h6, span, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy} from '../../../../../utils'
import clone = require('clone')


// How to use: include 'itemHeading', 'item' and 'itemDefault' in inputs object
//{...inputs, sectionHeading: 'Stage time', itemHeading: 'Host', item: some component, itemDefault: some component value default function}

function render(state, component_id, item_heading) {
  let children
  if (state.length === 0) {
    children = [`Click plus to add ${item_heading}`]
  } else if (state.length === 1) {
    children = state
  } else {
    children = state.map((x, index) => {
      const margin_class = index !== state.length - 1 ? '.mb-4' : ''
      return div('.row' + margin_class, [
        div('.col-12', [
          div('.row', [
            div('.col-12.raw-line.mb-xs', [
              span('.d-flex.align-content-center.mr-4', [`${item_heading} ${index + 1}`]),
              span('.appCollapseCollectionSubtractButton.fa.fa-minus.plus-button.btn.btn-link', {attrs: {'data-index': index}}, [])
            ])
          ]),
          x
        ])
      ])
    })
  }

  return div('.card.card-block', [
    div('.card-title.d-fx-a-c', [
      h6('.mb-0.mr-4', [component_id]),
      button('.appCollapseCollectionAddButton.fa.fa-plus.plus-button.btn.btn-link', [])
    ]),
  ].concat(children))
}

function intent(sources) {
  const {DOM} = sources

  return {
    add$: DOM.select('.appCollapseCollectionAddButton').events('click'),
    subtract$: DOM.select('.appCollapseCollectionSubtractButton').events('click').map(ev => {
      return parseInt(ev.target.dataset['index'])
    })
  }
}

function reducers(actions, inputs) {
  const add_r = actions.add$.map(_ => state => {
    const data = inputs.itemDefault()
    const structured = addStructure(data)
    return state.push(Immutable.fromJS(structured))
  })

  const subtract_r = actions.subtract$.map(index => state => {
    return state.delete(index)
  })

  const change_r = inputs.change$.map(msg => state => {
    return state.set(msg.index, Immutable.fromJS(msg.data))
  })

  return O.merge(add_r, subtract_r, change_r)
}

function addStructure(x) {
  return {
    data: x,
    errors: [],
    valid: true
  }
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(props => {
      // should be
      const init = props ? props.map(addStructure) : 
        [inputs.itemDefault()].map(addStructure)

      return reducer$.startWith(Immutable.fromJS(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())//.map(x => x.data))
    //.do(x => console.log('collapseCollection', x))
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
        return isolate(inputs.item)(sources, {...inputs, props$: O.of(props.data), component_index: index})
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

  const vtree$ = components_dom$.map(x => render(x, inputs.component_id || 'Component id not supplied', inputs.item_heading || 'Item heading not supplied'))

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
