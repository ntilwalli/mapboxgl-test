import {Observable as O} from 'rxjs'
import {div, span, button, h6, em, strong} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, capitalize} from '../../../../../../utils'
import DateInput from '../../../../../../library/bootstrapDateInput'
import clone = require('clone')

// How to use: include 'itemHeading', 'item' and 'itemDefault' in inputs object
//{...inputs, sectionHeading: 'Stage time', itemHeading: 'Host', item: some component, itemDefault: some component value default function}

function render(state, component_id, item_heading) {
  let children
  if (state.length === 0) {
    children = ['Click plus to add ' + item_heading]
  } else if (state.length === 1) {
    children = [
      div('.row', [
        div('.col-xs-12.d-fx-a-c', [
          state[0],
        ])
      ])
    ]
  } else {
    children = state.map((x, index) => {
      const margin_class = index !== state.length - 1 ? '.mb-1' : ''
      return div('.row' + margin_class, [
        div('.col-xs-12', [
          div('.row', [
            div('.col-xs-12.d-fx-a-c.mb-xs.fx-auto-width', [
              span('.d-fx-a-c.mr-1', [em([capitalize(item_heading) + ' ' + (index + 1)])]),
            ])
          ]),
          div('.ml-1', [x])
        ])
      ])
    })
  }

  return div('.form-group', [
    div('.row', [
      div('.col-xs-12', [
        div('.d-fx-a-c.mb-xs', [
          h6('.mb-0.mr-1', [component_id]),
          button('.appCollectionAddButton.fa.fa-plus.plus-button.btn.btn-link', [])
        ])
      ])
    ]),
    div('.row', [
      div('.col-xs-12', children)
    ]),
    state.length ? div('.row', [
      div('.col-xs-12', [

      ])
    ]) : null
  ])
}

function intent(sources) {
  const {DOM} = sources

  return {
    add$: DOM.select('.appCollectionAddButton').events('click'),
    subtract$: DOM.select('.appCollectionSubtractButton').events('click').map(ev => {
      return parseInt(ev.target.dataset['index'])
    })
  }
}

function toRRuleArray(rrule) {
  return [{

  }]
}

function fromRRuleArray(arr) {
  if (arr.length) {
    return {
      freq: "weekly",
      byweekday: ["monday"],
      interval: 1
    }
  }
}


function reducers(actions, inputs) {
  const add_r = actions.add$.map(_ => state => {
    return state.push(Immutable.fromJS(inputs.itemDefault()))
  })

  const subtract_r = inputs.remove$.map(index => state => {
    const out = state.delete(index)
    const blah = out.toJS()
    return out
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
      const init = props ? props.map(x => ({
        data: x,
        errors: [],
        valid: true
      })) : inputs.initEmpty ? [] : [addStructure(inputs.initDefault ? inputs.initDefault() : inputs.itemDefault())]

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
  const shared$ = inputs.props$.publishReplay(1).refCount()

  const actions = intent(sources)
  const change$ = createProxy()
  const remove$ = createProxy()

  const start_date = isolate(DateInput)(sources, {...inputs, props$: shared$})

  const state$ = model(actions, {...inputs, props$: shared$, change$, remove$})

  const components$ = state$
    .map(x => clone(x))
    .distinctUntilChanged((x, y) => {
      return x.length === y.length
    })
    .map(state => {
      const components = state.map((props, index) => {
        return isolate(inputs.item)(sources, {...inputs, props$: O.of(props), component_index: index})
      })
      
      const components_dom = components.map(x => x.DOM)
      const components_output = components.map(x => x.output$)
      const components_remove = components.map(x => x.remove$)
      const length = components.length

      return {
        DOM: length ? O.combineLatest(...components_dom) : O.of([]),
        output$: length ? O.combineLatest(...components_output) : O.of([]),
        remove$: length ? O.merge(...components_remove) : O.never()
      }
    }).publishReplay(1).refCount()

  const components_dom$ = components$.switchMap(x => x.DOM)
  const components_output$ = components$.switchMap(x => x.output$)
  remove$.attach(components$.switchMap(x => x.remove$))

  //change$.attach(components_output$)

  const vtree$ = components_dom$.map(x => {
    return render(x, inputs.component_id || 'Component id not supplied', inputs.item_heading || 'item')
  })

  return {
    DOM: vtree$,
    output$: components_output$.map(x => {
      return x.map(item => item.data)
    }).map(state => {
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
