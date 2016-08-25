import xs from 'xstream'
import delay from 'xstream/extra/delay'
import {div, span, input, i, a} from '@cycle/dom'
import {attrs, renderExternalLink, noopListener} from '../utils'

import Heading from '../heading/main'
import Logo from '../heading/logo/main'
import SearchBox from '../heading/searchBox/main'
import MenuModal from '../heading/menuModal/main'


//
// function login(sources, inputs) {
//   return {
//     DOM: xs.of({
//       large:
//       small: a(`.appLogIn.comp.login.nav-item-right-small.login.nav-item-logged-out.pull-xs-right`,
//         attrs({href: "/login"}),
//         [`Log in`])
//       })
//
//     output$: xs.never()
//   }
// }
//
// function signup(sources, inputs) {
//   return {
//     DOM: xs.of({
//       large: a(`.appSignUp.comp.signup.nav-item-right.nav-item-logged-out.pull-xs-right`,
//         attrs({href: "/signup"}),
//         [`Sign up`]),
//       small:
//     }),
//     output$: xs.never()
//   }
// }
//
// function logout(sources, inputs) {
//   return {
//     a(`.appSignUp.comp.signup.nav-item-right.nav-item-logged-out.pull-xs-right`,
//       attrs({href: "/signup"}),
//       [`Sign up`]),
//     output$: xs.never()
//   }
// }
//
// function createListing(sources, inputs) {
//   return {
//     DOM: xs.of({
//       large: div(`.comp pull-xs-left logo logo-large`),
//       small: div(`.appOpenMenuModal.comp-right.logo.logo-small.pull-xs-left`)
//     }),
//     output$: xs.of(`output1`, `output2`)
//   }
// }

export default function main(sources, inputs) {

  const heading = Heading(sources, {
    props$: xs.of([{
        name: `logoComponent`,
        component: Logo
      }
      , {
        name: `searchComponent`,
        component: SearchBox
      }
      , {
        name: `menuModal`,
        component: MenuModal
      }
    ]),
    state$: xs.merge(
      xs.of({
        showModal: false
      }),
      xs.of({
        auth: {},
        showModal: `menu`
      }).compose(delay(5000))
    )
  })

  return {
    DOM: heading.DOM,
    output$: heading.output$.debug().addListener(noopListener)
  }
}
