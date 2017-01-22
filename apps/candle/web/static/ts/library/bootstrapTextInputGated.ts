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
  const empty_is_error = state.get('empty_is_error')
  const validation = genericValidator(val, validator, !!empty_is_error)

  return state.set(`validated_value`, validation.value)
    .set(`errors`, validation.errors)
    .set(`valid`, !!(validation.errors.length === 0))
}

function reducers(actions, inputs: any) {
  const required = !!inputs.required
  const validate_on_blur = !!inputs.validate_on_blur

  const input_r = actions.input$.map(val => state => {
    const withValue = state.set(`value`, val)
      .set(`errors`, [])

    if (!validate_on_blur) {
      return validate(val, withValue, inputs.validator).set('emit', true)
    } else {
      return withValue.set('emit', false)
    }
  }) 

  const blur_r = actions.blur$.map(val => state => {
    const with_validation = validate(
      val, 
      state.set(`value`, val), 
      inputs.validator
    )

    const validated_value = with_validation.get(`validated_value`)
    if (required && (!validated_value || validated_value === "")) {
      return with_validation.set(`errors`, [`Required`])
        .set(`valid`, false)
    }

    return with_validation.set('emit', true)
  })

  const disabled_r = inputs.disabled$.skip(1).map(val => state => {
    return state.set(`disabled`, val).set('emit', true)
  })

  const errors_r = inputs.props$.switchMap(props => {
    const name = props.name
      return inputs.errors$.map(errors => state => {
        if (Array.isArray(errors)) {
          return state.set(`errors`, errors.filter(x => x.type === name).map(x => x.error)).set('emit', true)
        } else {
          return state.set('emit', true)
        }
      })
  })

  return O.merge(input_r, blur_r, disabled_r, errors_r)
}

const log = console.log.bind(console)

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const validator = inputs.validator
  return combineObj({
      props$: inputs.props$.take(1),
      initial_text$: inputs.initial_text$.take(1),
      disabled$: inputs.disabled$.take(1)
    })
    .map((info: any) => {
      //console.log(`info smart text input:`, info)
      const {props, initial_text, disabled} = info
      const validation = genericValidator(initial_text, validator, props.empty_is_error)
      return Immutable.Map({
        value: initial_text,
        validated_value: validation.value,
        errors: validation.errors,
        valid: validation.errors.length === 0,
        disabled,
        empty_is_error: props.empty_is_error,
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

function view(state$, props$, highlight_error$) {
  return combineObj({state$, props$, highlight_error$}).map((info: any) => {
    const {state, props, highlight_error} = info
    const placeholder = props && props.placeholder ? props.placeholder : undefined
    const type = props && props.type === `password` ? props.type : `text`
    const autofocus = props && !!props.autofocus
    const name = props.name
    const disabled = state.disabled
    const style_class = props.style_class || ''
    const valid = state.valid
    return div({class: {'has-danger': highlight_error && !valid}}, [input(`.appInput.form-control` + style_class, {class: {disabled}, attrs: {placeholder, name, type, autofocus, value: state.value, disabled}})])
  })
}

function main(sources, inputs) {
  const props$ = inputs.props$ || O.of({})
  const initial_text$ = inputs.initial_text$ || O.of(undefined)
  const disabled$ = inputs.disabled$ || O.of(false)
  const validator = inputs.validator || defaultValidator
  const required = !!inputs.required
  const validate_on_blur = !!inputs.validate_on_blur
  const errors$ = inputs.errors$ || O.never()
  const enriched_inputs = spread(inputs, {props$, errors$, required, validate_on_blur, validator, initial_text$, disabled$})
  const actions = intent(sources)
  const state$ = model(actions, enriched_inputs)

  const vtree$ = view(state$, props$, inputs.highlight_error$)
    // .letBind(traceStartStop(`DOM trace`))

  const output$ = state$
      .filter((x: any) => x.emit)
      .map((state: any) => { 
        return {
          data: state.valid ? state.validated_value : state.value,
          errors: state.errors,
          valid: state.valid
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

export default main