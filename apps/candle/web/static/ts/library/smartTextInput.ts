import {Observable as O} from 'rxjs'
import {div, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj} from '../utils'

function intent(sources) {
  const {DOM} = sources

  const input$ = DOM.select(`.appInput`).events(`keyup`)
    .map(ev => ev.target.value)

  return {
    input$
  }
}

const defaultParser = x => ({value: x, errors: []})
function reducers(actions, inputs: any) {
  const parser = inputs.parser || defaultParser
  const inputR = actions.input$.map(val => state => {
    const parsed = parser(val)
    return state.set(`value`, parsed.value)
      .set(`errors`, parsed.errors)
      .set(`isValid`, !!(parsed.value && parsed.errors.length === 0))
  })

  const disabledR = inputs.disabled$.skip(1).map(val => state => {
    return state.set(`disabled`, val)
  })

  return O.merge(inputR, disabledR)
}

const log = console.log.bind(console)

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const parser = inputs.parser || defaultParser
  const props$ = inputs.props$ || O.of(undefined)
  const disabled$ = inputs.disabled$ || O.of(undefined)
  return combineObj({
      props$: props$.take(1),
      disabled$: disabled$.take(1)
    })
    .map((info: any) => {
      const {props, disabled} = info
      const parsed = parser(props)
      return Immutable.Map({
        value: parsed.value,
        errors: parsed.errors,
        isValid: !!(parsed.value && parsed.errors.length === 0),
        disabled
      })
    })
    .switchMap(init => {
      return reducer$.startWith(init).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`textInput state:`, x))
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    const disabled = state.disabled
    const hasErrors = state.errors.length > 0
    return div(`.smart-text-input`, [
      input(`.appInput.text-input`, {class: {disabled}, attrs: {type: `text`, value: state.value, disabled}}),
      hasErrors && state.value && state.value.length ? div(`.errors`, {style: {color: "red"}}, state.errors.map(x => div([x]))) : null
    ])
  })
}

function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)
  return {
    DOM: vtree$,
    output$: state$
      .map(state => state.isValid ? state.value : undefined)
  }
}

export default isolate(main) 