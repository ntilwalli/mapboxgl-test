import {div} from '@cycle/dom'
import {combineObj} from '../../../utils'

const showLoader = state => {
  const {results, retrieving, searchPosition} = state
  return !Array.isArray(results) //|| retrieving
}

function renderLoader() {
  return div(`.retrieving-panel`, [
    div(`.loader-container`, [
      div(`.loader`)
    ])
  ])
}

function view(state$, components) {
  return combineObj({
    state$,
    components$: combineObj(components)
  })
  .debounceTime(0)
  .map((info: any) => {
    const {state, components} = info
    const {grid} = components
    return div(`.one-day-calendar`, [
      showLoader(state) ? renderLoader() : grid
    ])
  })
}

export default view

