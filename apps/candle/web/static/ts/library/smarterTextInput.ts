import {Observable as O} from 'rxjs'
import {div, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, spread, traceStartStop} from '../utils'

export interface SmartTextInputValidation {
  value: any | undefined;
  errors: string[];
}

function intent(sources) {
  const {DOM} = sources

  const input$ = DOM.select(`.appInput`).events(`keyup`)
    .map(ev => ev.target.value)
    .publishReplay(1).refCount()

  const blur$ = DOM.select(`.appInput`).events(`blur`)
    .map(ev => ev.target.value)
    .publishReplay(1).refCount()

  return {
    input$,
    blur$
  }
}

function defaultValidator(x): SmartTextInputValidation {
  return {value: x, errors: []}
}

function validate(val, state, validator) {
  const validation = validator(val)

  return state.set(`validatedValue`, validation.value)
    .set(`errors`, validation.errors)
    .set(`isValid`, !!(validation.value && validation.errors.length === 0))
}

function reducers(actions, inputs: any) {
  const required = !!inputs.required
  const validateOnBlur = !!inputs.validateOnBlur

  const inputR = actions.input$.map(val => state => {
    const withValue = state.set(`value`, val)
      .set(`errors`, [])

    if (!validateOnBlur) {
      return validate(val, withValue, inputs.validator)
    } else {
      return withValue
    }
  }) 

  const blurR = actions.blur$.map(val => state => {
    const withValidation = validate(
      val, 
      state.set(`value`, val), 
      inputs.validator
    )

    const validatedValue = withValidation.get(`validatedValue`)
    if (required && (!validatedValue || validatedValue === "")) {
      return withValidation.set(`errors`, [`Required`])
        .set(`isValid`, false)
    }

    return withValidation
  })

  const disabledR = inputs.disabled$.skip(1).map(val => state => {
    return state.set(`disabled`, val)
  })

  const errorsR = inputs.props$.switchMap(props => {
    const name = props.name
      return inputs.errors$.map(errors => state => {
        if (Array.isArray(errors)) {
          return state.set(`errors`, errors.filter(x => x.type === name).map(x => x.error))
        } else {
          return state 
        }
      })
  })

  return O.merge(inputR, blurR, disabledR, errorsR)
}

const log = console.log.bind(console)

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const validator = inputs.validator
  return combineObj({
      props$: inputs.initialText$.take(1),
      disabled$: inputs.disabled$.take(1)
    })
    .map((info: any) => {
      //console.log(`info smart text input:`, info)
      const {props, disabled} = info
      const validation = validator(props)
      return Immutable.Map({
        value: props,
        validatedValue: validation.value,
        errors: validation.errors,
        isValid: !!(validation.value && validation.errors.length === 0),
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
    const outlineClass = hasErrors && ((props.emptyIsError && !state.value) || state.value)
    const styleClass = props && props.styleClass || ``
    return div(`.smarter-text-input`, [
      input(`.appInput${styleClass}`, {class: {disabled, error: outlineClass}, attrs: {placeholder, name, type, autofocus, value: state.value, disabled}}),
    ])
  })
}

function main(sources, inputs) {
  const props$ = inputs.props$ || O.of({})
  const initialText$ = inputs.initialText$ || O.of(undefined)
  const disabled$ = inputs.disabled$ || O.of(false)
  const validator = inputs.validator || defaultValidator
  const required = !!inputs.required
  const validateOnBlur = !!inputs.validateOnBlur
  const errors$ = inputs.errors$ || O.never()
  const enrichedInputs = spread(inputs, {errors$, required, validateOnBlur, validator, initialText$, disabled$})
  const actions = intent(sources)
  const state$ = model(actions, enrichedInputs)

  const vtree$ = view(state$, props$)
    // .letBind(traceStartStop(`DOM trace`))

  const output$ = state$
      .map((state: any) => ({
        value: state.isValid ? state.validatedValue : undefined,
        errors: state.errors,
        valid: state.isValid
      }))
      // .letBind(traceStartStop(`output$ trace`))
      .publishReplay(1).refCount()

  return {
    DOM: vtree$,
    output$
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)