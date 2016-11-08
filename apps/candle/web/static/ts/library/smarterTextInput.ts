import {Observable as O} from 'rxjs'
import {div, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy, spread} from '../utils'

function intent(sources) {
  const {DOM} = sources

  const input$ = DOM.select(`.appInput`).events(`keyup`)
    .map(ev => ev.target.value)

  return {
    input$
  }
}

const defaultParser = (sources, value$) => {
  return {
    output$: value$.map(x => ({
      errors: [],
      parsedValue: x
    })),
    HTTP: O.never()
  }
}

function reducers(actions, inputs: any) {
  const inputR = actions.input$.map(val => state => {
    return state.set(`value`, val)
      .set(`errors`, [])
      .set(`isValid`, false)
      .set(`parsedValue`, undefined)
  })

  const validationR = inputs.validation$.map(val => state => {
    const {parsedValue, errors} = val
    return state.set(`parsedValue`, parsedValue)
      .set(`errors`, errors)
      .set(`isValid`, !!parsedValue && Array.isArray(errors) && errors.length === 0)
  })

  const disabledR = inputs.disabled$.skip(1).map(val => state => {
    return state.set(`disabled`, val)
  })

  return O.merge(inputR, disabledR)
}

const log = console.log.bind(console)

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      initialText$: inputs.initialText$.take(1),
      disabled$: inputs.disabled$.take(1)
    })
    .map((info: any) => {
      const {initialText, disabled} = info
      return Immutable.Map({
        value: initialText, 
        parsedValue: undefined,
        errors: [],
        isValid: false,
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

function view(state$, props$) {
  return combineObj({state$, props$}).map((info: any) => {
    const {state, props} = info
    const placeholder = props && props.placeholder ? props.placeholder : undefined
    const type = props && props.type === `password` ? props.type : `text`
    const autofocus = props && !!props.autofocus
    const name = props.name 
    const disabled = state.disabled
    const hasErrors = state.errors.length > 0
    const styleClass = props && props.styleClass || ``
    return div(`.smarter-text-input`, [
      input(`.appInput.text-input${styleClass}`, {class: {disabled}, attrs: {placeholder, name, type, autofocus, value: state.parsedValue || state.value, disabled}}),
      hasErrors && state.value && state.value.length ? div(`.errors`, {style: {color: "red"}}, state.errors.map(x => div([x]))) : null
    ])
  })
}

function main(sources, inputs) {
  const props$ = inputs.props$ || O.of({})
  const initialText$ = inputs.initialText$ || O.of(undefined)
  const disabled$ = inputs.disabled$ || O.of(false)
  const validation$ = createProxy()

  const enrichedInputs = spread(inputs, {validation$, initialText$, disabled$})
  const actions = intent(sources)
  const parser = inputs.parser || defaultParser
  const state$ = model(actions, enrichedInputs)
  const parsed = parser(sources, state$.pluck(`value`).distinctUntilChanged())
  validation$.attach(parsed.output$)

  const vtree$ = view(state$, props$)
  return {
    DOM: vtree$,
    HTTP: parsed.HTTP,
    output$: state$
      .map(state => state.isValid ? state.value : undefined)
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)