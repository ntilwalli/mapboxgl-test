import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, input} from '@cycle/dom'
import Immutable from 'immutable'
import {attrs, combineObj, spread} from '../utils'

function intent(sources) {
  const {DOM} = sources
  const value$ = O.merge(DOM.select(`input`).events(`keyup`), DOM.select(`input`).events(`change`))
    .map(ev => ev.target.value)
  const blur$ = DOM.select(`input`).events(`blur`)
  const focus$ = DOM.select(`input`).events(`focus`)

  return {
    value$,
    blur$,
    focus$
  }
}

function defaultValidator() { return [] }
function isValid(validation, external) { return validation.length === 0 && external.length === 0}

function reducers(actions, inputs) {
  const {props$, error$} = inputs

  const errorR = props$.switchMap(props => {
    const {name} = props
    return error$.map(sentError => state => {
      const val = (sentError && sentError.errors && sentError.errors.filter(x => x.type === name).map(x => x.error)) || []
      return state.set(`external`, val)
    })
  })

  const valueR = props$.switchMap(props => {
    const validator = props.validator || defaultValidator
    const {required} = props
    return actions.value$
      .map(value => state => {
        if (!required || value && value.length > 0) {
          const validation = validator(value)
          return state.set(`external`, []).set(`value`, value || ``).set(`validation`, validation).set(`valid`, isValid(validation, []))
        } else {
          return state.set(`external`, []).set(`value`, value || ``).set(`validation`, []).set(`valid`, false)
        }
      })
    })

  const blurR = actions.blur$
    .map(() => state => {
      return state.set(`coloring`, true)
    })

  const focusR = actions.focus$
    .map(() => state => {
      return state.set(`coloring`, false)//.set(`external`, [])
    })

  return O.merge(
    errorR,
    valueR,
    blurR,
    focusR
  )
}

function model(actions, inputs) {
  const initialText$ = inputs.initialText$ || O.of(undefined)
  const props$ = inputs.props$
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    props$,
    initialText$
  }).map(inputs => {
    const {props, initialText} = inputs
    const validator = props.validator || defaultValidator
    const value = initialText || ``
    const validation = validator(value)
    const external = []
    return {
      value,
      validation,
      external,
      coloring: false,
      valid: isValid(validation, external)
    }
  }).switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    .publishReplay(1).refCount()
}

function view(state$, inputs) {
  const {props$} = inputs
  return combineObj({state$, props$}).map(inputs => {
    const {state, props} = inputs
    const {type, key, placeholder, name} = props
    const hasDanger = state.coloring && state.validation.length > 0
    const errors = (hasDanger ? state.validation : []).concat(state.external)

    //if (name === `password`) {console.log(state); state.value = "blah";}

    return div(
      `.form-group`,
      {class: {'has-danger': hasDanger}},
      [
        input(`.form-control`, {key: key ? name+key : ``, attrs: {type: type || `text`, placeholder, name, value: state.value}}),
        ...errors.map(err => div(`.input-error`, [err]))
      ]
    )
  })
}

function main(sources, inputs) {

  const {props$, error$, initialValue$} = inputs
  const updatedInputs = spread(inputs, {
    props$: props$.publishReplay(1).refCount()
  })

  const actions = intent(sources)
  const state$ = model(actions, updatedInputs)
  const vtree$ = view(state$, updatedInputs)

  return {
    DOM: vtree$.map(x => {
      return x
    }),
    value$: state$.map(state => ({value: state.value, valid: state.valid}))
      .map(x => {
        return x
      })
      .publishReplay(1).refCount()
  }
}

export default (sources, inputs) => isolate(main)(sources,inputs)