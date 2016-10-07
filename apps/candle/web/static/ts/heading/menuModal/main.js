import xs from 'xstream'
import {div, span, input, i, ul, li, a} from '@cycle/dom'
import {attrs, renderExternalLink} from '../../utils'

function intent(sources) {
  const signup$ = sources.DOM.select(`.appSignUp`).events(`click`).mapTo(`signup`)
  const login$ = sources.DOM.select(`.appLogIn`).events(`click`).mapTo(`login`)
  const logout$ = sources.DOM.select(`.appLogOut`).events(`click`).mapTo(`logout`)
  const createListing$ = sources.DOM.select(`.appCreateNew`).events(`click`).mapTo(`createListing`)

  return {
    signup$, login$, logout$, createListing$
  }
}

function renderMenuItemsLarge(state) {
  return !state.authorization ? [
      a(`.appSignUp.comp.signup.nav-item-right.nav-item-logged-out.pull-xs-right`,
        attrs({href: "/signup"}),
        [`Sign up`]),
      a(`.appLogIn.comp.login.nav-item-right-small.login.nav-item-logged-out.pull-xs-right`,
        attrs({href: "/login"}),
        [`Log in`])
    ] : [
      div(`.comp.menu-item.nav-item-right.nav-item-logged-in.pull-xs-right`, [
        div(`.appCreateNew.add-content-button`, [`Create new`])
      ]),
      renderExternalLink(`Log out`, `.appLogOut.comp.nav-item-right-small.log-out.nav-item-logged-in.pull-xs-right`)
    ]
}


function renderMenuItemsSmall(state) {
  return state.authorization ? [
    li([
      a({props: {href: `/create`}}, [`Create new`])
    ]),
    li([
      renderExternalLink(`Log blah out`, `.appLogOut`)
    ])
  ] : [
    li([
      a({props: {href: `/login`}}, [`Log in`])
    ]),
    li([
      a({props: {href: `/signup`}}, [`Sign up`])
    ])
  ]
}

function renderMenuModal(state) {
  //console.log(state)
  return [state.showModal === `menu` ? div(`.appModal.modal.fade.in.show`, [
    div(`.slideout-menu`, attrs({role: `document`}), [
      div(`.slideout-menu-header`, [
        div(`.logo.logo-large`)
      ]),
      div(`.slideout-menu-body`, [
        ul(`.list-unstyled`, [
          ...renderMenuItemsSmall(state)
        ])
      ])
    ])
  ]) : null]
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  //console.log(inputs.props$)
  return {
    DOM: inputs.parentState$.map(state => {
      return {
        large: div(`.nav-menu-items-right`, renderMenuItemsLarge(state)),
        small: div(`.nav-menu-items-right`, renderMenuModal(state))
      }
    }),
    message$: xs.merge(...Object.keys(actions).map(k => actions[k]))
  }
}
