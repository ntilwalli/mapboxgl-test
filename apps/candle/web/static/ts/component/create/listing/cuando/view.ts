import {Observable as O} from 'rxjs'
import {div, input, select, option} from '@cycle/dom'
import {combineObj} from '../../../../utils'


function renderRegionMethodCombo(info) {
  const {state} = info
  const {settings} = state
  const {use_region} = settings
  const ul  = use_region

  //console.log(ul)
  return div(`.region-combo-section`, [
    div(`.heading`, [`Region Method`]),
    select(`.appRegionComboBox.choice`, [
      option(`.combo-item`, {attrs: {value: `user`, selected: ul === `user`}}, [`Use my location`]),
      option(`.combo-item`, {attrs: {value: `default`, selected: ul === `default`}}, [`Use default region`])
    ])
  ])
}

function renderEventTypeChooser(info) {
  const {state} = info
  const {session} = state
  const {listing} = session
  const {type} = listing
  return div(`.cuando-type-section`, [
    div(`.heading`, [`Type`]),
    select(`.appCuandoTypeComboBox.choice`, [
      option(`.combo-item`, {attrs: {value: `single`, selected: type === `single`}}, [`Single`]),
      option(`.combo-item`, {attrs: {value: `recurring`, selected: type === `recurring`}}, [`Recurring`])
    ])
  ])
}

export default function view(state$, components) {
  return state$.map(state => {
    const info = {
      state
    }

    return div(`.cuando`, [
      renderEventTypeChooser(info)
    ])
  })
}