import {Observable as O} from 'rxjs'
import {div, button, li, nav, span, select, input, option, label, h6} from '@cycle/dom'
import {combineObj} from '../utils'

function intent(sources) {
  const {DOM} = sources

  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)
  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)

  return {
    show_menu$,
    brand_button$
  }
}

// function renderNavigator() {
//   return nav('.navbar.navbar-light.bg-faded.container-fluid', [
//     div('.row.no-gutter', [
//       div('.col-xs-6', [
//         button('.appBrandButton.hopscotch-icon.nav-brand', []),
//       ]),
//       div('.col-xs-6', [
//         button('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link.float-xs-right', []),
//       ]),
//     ])
//   ])
// }

function view() {
  return O.of(div(`.screen`, [
    //renderNavigator(),
    div('.loader-container.nav-fixed-offset', [
      div('.loader', [])
    ])
  ]))
}


export default function main(sources, inputs) {

  const actions = intent(sources)
  const vtree$ = view()

  const out = {
    DOM: vtree$,
    Router: actions.brand_button$.mapTo('/'),
    MessageBus: actions.show_menu$.mapTo({to: `main`, message: {type: `showLeftMenu`, data: {redirect_url: inputs.redirect_url || '/'}}}),
  }

  return out
}