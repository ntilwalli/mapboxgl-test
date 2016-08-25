import {Observable as O} from 'rxjs'
import {div, a} from '@cycle/dom'
import Immutable from 'immutable'
import {combineObj, normalizeComponent, renderExternalLink, attrs} from '../../../utils'

import Logo from '../logo'
import SearchBox from '../searchBox'

function intent(sources) {
  const {DOM} = sources
  const logout$ = DOM.select(`.appLogOut`).events(`click`)
  const create$ = DOM.select(`.appCreateNew`).events(`click`)

  return {
    logout$,
    create$
  }
}

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$ || O.of({})

  return combineObj({
    props$,
    authorization$: inputs.authorization$.take(1)
  })
    .map(inputs => {
      const {props, authorization} = inputs
      return {
        authorization
      }
    })
    .switchMap(initialState => reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc)))
    .map(x => x.toJS())
    .cache(1)
}

function renderMenuItemsLarge(state) {
  if (!state.authorization) { 
    return div(`.menu-area.hidden-sm-down`, [
      a(`.appSignUp.comp`,
        attrs({href: "/?modal=signup"}),
        [`Sign up`]),
      a(`.appLocalLogIn.comp`,
        attrs({href: "/?modal=login"}),
        [`Log in`])
    ])
  } else { 
    return div(`.menu-area.hidden-sm-down`, [
      div(`.comp.menu-item`, [
        div(`.appCreateNew.add-content-button`, [`Create new`])
      ]),
      renderExternalLink(`Log out`, `.appLogOut.comp.log-out`)
    ])
  }
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)}).map(inputs => {
    const {state, components} = inputs
    const {logo, searchBox} = components
    return div(`.page-heading`, [
      logo,
      searchBox,
      //div(`.hidden-sm-down`, [
        renderMenuItemsLarge(state)
      //])
    ])
  })
}

export default function main(sources, inputs) {
  const logo = Logo(sources, inputs)
  const searchBox = SearchBox(sources, inputs)
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const components = {
    logo$: logo.DOM,
    searchBox$: searchBox.DOM
  }
  const vtree$ = view(state$, components)
  return normalizeComponent({
    DOM: vtree$,
    Router: O.merge(
      logo.Router,
      actions.create$.mapTo(`/create`)
    ),
    message$: O.merge(logo.message$, actions.logout$.mapTo({
      type: `authorization`,
      data: { type: `logout` }
    }))
  })
}
