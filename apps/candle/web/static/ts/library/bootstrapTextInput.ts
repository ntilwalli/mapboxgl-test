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

function genericValidator(input, f, empty_is_error) {
  if (!input && !empty_is_error) {
    return {
      value: input,
      errors: []
    }
  } else if (input) {
    if (!input.length && !empty_is_error) {
      return {
        value: input,
        errors: []
      }
    } else if (input.length) {
      return f(input)
    } else {
      return  {
        value: input,
        errors: ['Cannot be empty']
      }
    }

  } else {
    return {
      value: input,
      errors: ['Cannot be empty']
    }
  }
}

function validate(val, state, validator) {
  const emptyIsError = state.get('emptyIsError')
  const validation = genericValidator(val, validator, !!emptyIsError)

  return state.set(`validatedValue`, validation.value)
    .set(`errors`, validation.errors)
    .set(`isValid`, !!(validation.errors.length === 0))
}

function reducers(actions, inputs: any) {
  const required = !!inputs.required
  const validateOnBlur = !!inputs.validateOnBlur

  const inputR = actions.input$.map(val => state => {
    const withValue = state.set(`value`, val)
      .set(`errors`, [])

    if (!validateOnBlur) {
      return validate(val, withValue, inputs.validator).set('emit', true)
    } else {
      return withValue.set('emit', false)
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

    return withValidation.set('emit', true)
  })

  const disabledR = inputs.disabled$.skip(1).map(val => state => {
    return state.set(`disabled`, val).set('emit', true)
  })

  const errorsR = inputs.props$.switchMap(props => {
    const name = props.name
      return inputs.errors$.map(errors => state => {
        if (Array.isArray(errors)) {
          return state.set(`errors`, errors.filter(x => x.type === name).map(x => x.error)).set('emit', true)
        } else {
          return state.set('emit', true)
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
      props$: inputs.props$.take(1),
      initialText$: inputs.initialText$.take(1),
      disabled$: inputs.disabled$.take(1)
    })
    .map((info: any) => {
      //console.log(`info smart text input:`, info)
      const {props, initialText, disabled} = info
      const validation = genericValidator(initialText, validator, props.emptyIsError)
      return Immutable.Map({
        value: initialText,
        validatedValue: validation.value,
        errors: validation.errors,
        isValid: validation.errors.length === 0,
        disabled,
        emptyIsError: props.emptyIsError,
        emit: true
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
    const styleClass = props.styleClass || ''
    const valid = state.isValid
    return div({class: {'has-danger': !valid}}, [input(`.appInput.form-control` + styleClass, {class: {disabled}, attrs: {placeholder, name, type, autofocus, value: state.value, disabled}})])
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
  const enrichedInputs = spread(inputs, {props$, errors$, required, validateOnBlur, validator, initialText$, disabled$})
  const actions = intent(sources)
  const state$ = model(actions, enrichedInputs)

  const vtree$ = view(state$, props$)
    // .letBind(traceStartStop(`DOM trace`))

  const output$ = state$
      .filter((x: any) => x.emit)
      .map((state: any) => { 
        return {
          //data: state.isValid ? state.validatedValue : undefined,
          data: state.isValid ? state.validatedValue : state.value,
          errors: state.errors,
          valid: state.isValid
        }
      })
      // .letBind(traceStartStop(`output$ trace`))
      //.publishReplay(1).refCount()

  return {
    DOM: vtree$,
    output$: output$.map(x => {
      return x
    })
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)