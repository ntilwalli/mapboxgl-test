import {Observable as O} from 'rxjs'
import {div, input, span} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, normalizeSink, spread, createProxy, traceStartStop} from '../../../utils'
import SmartTextInput from '../../../library/smartTextInput'
import {getDefaultFilters} from './helpers'

function intent(sources) {
  const {DOM} = sources

  const filterCategories$ = DOM.select(`.appFilterCategories`).events(`click`)
    .map(ev => !!ev.target.checked)
  const categoryComedy$ = DOM.select(`.appCategoryComedy`).events(`click`)
    .map(ev => !!ev.target.checked)
  const categoryMusic$ = DOM.select(`.appCategoryMusic`).events(`click`)
    .map(ev => !!ev.target.checked)
  const categoryPoetry$ = DOM.select(`.appCategoryPoetry`).events(`click`)
    .map(ev => !!ev.target.checked)
  const categoryStorytelling$ = DOM.select(`.appCategoryStoryTelling`).events(`click`)
    .map(ev => !!ev.target.checked)

  const filterCosts$ = DOM.select(`.appFilterCosts`).events(`click`)
    .map(ev => !!ev.target.checked)
  const costFree$ = DOM.select(`.appCostFree`).events(`click`)
    .map(ev => !!ev.target.checked)
  const costPaid$ = DOM.select(`.appCostPaid`).events(`click`)
    .map(ev => !!ev.target.checked)

  const filterStageTime$ = DOM.select(`.appFilterStageTime`).events(`click`)
    .map(ev => !!ev.target.checked)

  return {
    filterCategories$,
    categoryComedy$,
    categoryMusic$,
    categoryPoetry$,
    categoryStorytelling$,
    filterCosts$,
    costFree$,
    costPaid$,
    filterStageTime$
  }
}

function unique(value, index, self) {
  return self.indexOf(value) === index
}

function updateStateArray(state, prop, flag, value) {
  if (flag) {
    return state.update(prop, x => x.concat([value]).filter(unique))
  } else {
    return state.update(prop, x => x.filter(x => x !== value))
  }
}

function reducers(actions, inputs) {
  const filterCategoriesR = actions.filterCategories$.map(val => state => {
    return state.set(`filterCategories`, val)
  })

  const categoryComedyR = actions.categoryComedy$.map(val => state => {
    return updateStateArray(state, `categories`, val, `comedy`)
  })
  const categoryMusicR = actions.categoryMusic$.map(val => state => {
    return updateStateArray(state, `categories`, val, `music`)
  })
  const categoryPoetryR = actions.categoryPoetry$.map(val => state => {
    return updateStateArray(state, `categories`, val, `poetry`)
  })

  const categoryStorytellingR = actions.categoryStorytelling$.map(val => state => {
    return updateStateArray(state, `categories`, val, `storytelling`)
  })

  const filterCostsR = actions.filterCosts$.map(val => state => {
    return state.set(`filterCosts`, val)
  })

  const costFreeR = actions.costFree$.map(val => state => {
    return updateStateArray(state, `costs`, val, `free`)
  })

  const costPaidR = actions.costPaid$.map(val => state => {
    return updateStateArray(state, `costs`, val, `paid`)
  })

  const filterStageTimeR = actions.filterStageTime$.map(val => state => {
    return state.set(`filterStageTime`, val)
  })

  const stageTimeR = inputs.stageTime$.skip(1).map(val => state => {
    return state.set(`stageTime`, val)
  })

  return O.merge(
    filterCategoriesR, categoryComedyR, categoryMusicR, categoryPoetryR, categoryStorytellingR,
    filterCostsR, costFreeR, costPaidR,
    filterStageTimeR, stageTimeR
  )
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$
  return props$
    .map(props => {
      //console.log(`filter props:`, props)
      return Immutable.Map(props)
    })
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`filters state:`, x))
    //.letBind(traceStartStop())
    .publishReplay(1).refCount()
}

function renderCheckbox(state, appClass, title, containedBy, value, disabledBy?) {
  const disabled = disabledBy && state.hasOwnProperty(disabledBy) ? !state[disabledBy] : false
  const container = state[containedBy]
  const checked = Array.isArray(container) ? container.some(x => x === value) : container === value
  return span(`.checkbox`, [
    input(
      appClass,
      {attrs: {
        type: `checkbox`, 
        checked,
        disabled
      }}
    ),
    span(`.title`, {class: {disabled}}, [title])
  ])
}

function renderCategories(state) {
  return div(`.categories`, [
    div(`.switch-section`, [
      renderCheckbox(state, `.appFilterCategories`, `Categories`, `filterCategories`, true),
      div(`.content`, [
        renderCheckbox(state, `.appCategoryComedy`, `Comedy`, `categories`, `comedy`, `filterCategories`),
        renderCheckbox(state, `.appCategoryMusic`, `Music`, `categories`, `music`, `filterCategories`),
        renderCheckbox(state, `.appCategoryPoetry`, `Poetry`, `categories`, `poetry`, `filterCategories`),
        renderCheckbox(state, `.appCategoryStoryTelling`, `Storytelling`, `categories`, `storytelling`, `filterCategories`)
      ])
    ])
  ])
}

function renderCosts(state) {
  return div(`.cost`, [
    div(`.switch-section`, [
      renderCheckbox(state, `.appFilterCosts`, `Cost`, `filterCosts`, true),
      div(`.content`, [
        renderCheckbox(state, `.appCostFree`, `Free`, `costs`, `free`, `filterCosts`),
        renderCheckbox(state, `.appCostPaid`, `Paid`, `costs`, `paid`, `filterCosts`)
      ])
    ])
  ])
}

function renderStageTime(info) {
  const {state, components} = info
  const {stageTime} = components
  const disabled = !state.filterStageTime
  return div(`.stage-time`, [
    div(`.switch-section`, [
      renderCheckbox(state, `.appFilterStageTime`, `Minimum stage time (minutes)`, `filterStageTime`, true),
      div(`.content`, [stageTime])
    ])
  ])
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      return div(`.filters-dialog`, [
        renderCategories(state),
        renderCosts(state),
        renderStageTime(info)
      ])
    })
}

const stageTimeParser = x => {
  const val = parseInt(x); 
  if (isNaN(val)) {
    return {value: x, errors: [`Must be a number`]}
  } else {
    return {value: val, errors: []}
  }
}

function main(sources, inputs) {
  const props$ = inputs.props$ ? inputs.props$.take(1) : O.of(getDefaultFilters())

  const actions = intent(sources)
  const stageTimeProxy$ = createProxy()

  const state$ = model(actions, {props$, stageTime$: stageTimeProxy$})

  const stageTime = SmartTextInput(sources, {
    props$: props$.pluck(`stageTime`), 
    parser: stageTimeParser,
    disabled$: state$.map(x => !x.filterStageTime).distinctUntilChanged()
  })

  const components = {
    stageTime$: stageTime.DOM
  }

  stageTimeProxy$.attach(stageTime.output$)


  const vtree$ = view(state$, components)
  return {
    DOM: vtree$,
    output$: state$
  }
}

export default main