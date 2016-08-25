import xs from 'xstream'
import {div, button} from '@cycle/dom'
import {noopListener} from '../../utils'

function intent(sources) {
  const home$ = sources.DOM.select(`.appHomeButton`).events(`click`)
    .mapTo({type: `home`})
  const openMenu$ = sources.DOM.select(`.appOpenMenuModal`).events(`click`)
    .mapTo({type: 'menu'})
  return {
    home$, openMenu$
  }
}


export default function logo(sources, inputs) {
  const actions = intent(sources)

  return {
    DOM: xs.of({
      large: button(`.appHomeButton.comp.pull-xs-left.logo.logo-large`),
      small: button(`.appOpenMenuModal.comp.logo.logo-small.pull-xs-left`)
    }),
    message$: xs.merge(actions.home$, actions.openMenu$)
  }
}
