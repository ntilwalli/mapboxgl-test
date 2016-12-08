import {Observable as O} from 'rxjs'
import {div, span, button} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy} from '../../../../../utils'
import clone = require('clone')

function StubComponent(sources, inputs) {
  return {
    DOM: O.of(div(['Hello'])),
    output$: O.never()//
    // O.of({
    //   type: 'update',
    //   index: 1,
    //   data: {
    //     value: 'Hello',
    //     valid: false,
    //     errors: ['Some error']
    //   }
    // })
  }
}

function getDefault() {
  return {
    data: {
      value: 'Hello',
      valid: false,
      errors: ['something']
    }
  }
}

// function getDefault() {
//   return {
//     value: {
//       type: StageTimeOptions.MINUTES
//       data: {
//         type: MinutesTypeOptions.MAX,
//         data: {
//           max: 5
//         }
//       }
//     },
//     valid: true,
//     errors: []
//   }
// }

function render(state) {
  let children
  if (state.length === 0) {
    children = [div('.item', ['Click plus to add item'])]
  } else if (state.length === 1) {
    children = [div(`.item`, state)]
  } else {
    children = state.map((x, index) => div('.column.small-margin-bottom', [
      div('.row', [
        span('.sub-sub-heading.item', [`Round ${index + 1}`]), 
        span('.appSubtractButton.list-button.fa.fa-minus', {attrs: {'data-index': index}}, [])
      ]),
      div('.item.indented', [x])
    ]))
  }

  return div('.column', [
    div('.row.small-margin-bottom', [
      div('.sub-heading.section-heading', ['Stage time']),
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
    return state.push(Immutable.fromJS(getDefault()))
  })

  const subtract_r = actions.subtract$.map(index => state => {
    return state.delete(index)
  })

  const change_r = inputs.change$.map(msg => state => {
    return state.set(msg.index, Immutable.fromJS(msg.value))
  })

  return O.merge(add_r, subtract_r, change_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(props => {
      // should be
      const init = props || [getDefault()]

      return reducer$.startWith(Immutable.fromJS(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS().map(x => x.data))
    .publishReplay(1).refCount()
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const change$ = createProxy()
  const state$ = model(actions, {...inputs, change$})

  const components$ = state$
    .distinctUntilChanged((x, y) => x.length === y.length)
    .map(my_state => {
      const state = JSON.parse(JSON.stringify(my_state));
      const components = state.map((props, index) => StubComponent(sources, {...inputs, props$: O.of(props.value), index}))
      const components_dom = components.map(x => x.DOM)
      const components_output = components.map(x => x.output$)

      return {
        DOM: O.combineLatest(...components_dom),
        output$: O.combineLatest(...components_output)
      }
    }).publishReplay(1).refCount()

  const components_dom$ = components$.switchMap(x => x.DOM)
  const components_output$ = components$.switchMap(x => x.output$)

  change$.attach(components_output$)

  const vtree$ = components_dom$.map(render)

  return {
    DOM: vtree$,
    output$: state$.map(state => {
      return {
        value: state.map(x => x.value),
        valid: state.every(x => x.valid === true),
        errors: state.reduce((acc, item) => acc.concat(item.errors), [])
      }
    })
  }
}
