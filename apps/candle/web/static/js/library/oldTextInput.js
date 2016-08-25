import {Observable as O} from 'rxjs'
import {div, input} from '@cycle/dom'
import Immutable from 'immutable'
import {attrs, combineObj} from '../utils'

function intent(sources, inputs) {
  const {DOM} = sources
  const {cssInput, name} = inputs
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

function isValid(errors) { return errors.length === 0 }

function reducers(actions, inputs) {
  const {validator, required} = inputs

  const valueR = actions.value$
    .map(value => state => {
      if (!required || value && value.length > 0) {
        const errors = validator(value)
        return state.set(`forcedErrors`, []).set(`value`, value || ``).set(`errors`, errors).set(`valid`, isValid(errors))
      } else {
        return state.set(`forcedErrors`, []).set(`value`, value || ``).set(`errors`, []).set(`valid`, false)
      }

    })

  const blurR = actions.blur$
    .map(() => state => {
      return state.set(`coloring`, true)
    })

  const focusR = actions.focus$
    .map(() => state => {
      return state.set(`coloring`, false).set(`forcedErrors`, [])
    })

  return O.merge(
    valueR,
    blurR,
    focusR
  )
}

function model(actions, props, forced$) {
  const reducer$ = reducers(actions, props)
  const fooForced$ = forced$ || O.of(null)
  return fooForced$
    .switchMap(forced => {
      //console.log(`textInput: ${props.name}`)
      //console.log(forced)
      //console.log(props.name)
      const value = (forced && forced[props.name]) || ``
      const errors = props.validator(value)
      const initialState = {
        value,
        errors,
        forcedErrors: (forced  && forced.errors && forced.errors.filter(x => x.type === props.name).map(x => x.error)) || [],
        coloring: false,
        valid: isValid(errors)
      }

      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    .cache(1)
}

function view(state$, {type, key, placeholder, name}) {
  return state$.map(state => {
    const hasDanger = state.coloring && state.errors.length > 0
    const errors = (hasDanger ? state.errors : []).concat(state.forcedErrors)

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

export default function textInput(sources, props, forced$) {

  if (!props.hasOwnProperty(`validator`)) {
    props[`validator`] = () => []
  }



  const actions = intent(sources, props)
  const state$ = model(actions, props, forced$)
  const vtree$ = view(state$, props)

  return {
    DOM: vtree$,
    value$: state$.map(state => ({value: state.value, valid: state.valid}))
  }
}
