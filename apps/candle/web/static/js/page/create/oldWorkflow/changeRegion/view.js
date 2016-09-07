import xs from 'xstream'
import {h3, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
import combineObj from '../../../combineObj'
import {attrs} from '../../../utils'

function renderHeading(val) {
  return div(`.panel-title`, [h3([val])])
}

function renderPlaceTypeOptions(state) {
  const type = state.type
  return div()
}


function renderPanel({state, components: {autocomplete, radio}}) {

  return div(`.panel-content`, [
    autocomplete
  ])
}

export default function view({state$, components}) {
  return combineObj({state$, components: combineObj(components)}).map(info => {
    return div(`.panel`, [
      renderHeading(`Where is the event?`),
      renderPanel(info)
    ])
  })
}
