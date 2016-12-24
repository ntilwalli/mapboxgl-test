import {Observable as O} from 'rxjs'
import {div, span, button, nav, a} from '@cycle/dom'
import {combineObj, processHTTP, componentify, spread, defaultNever} from '../../utils'
import Immutable = require('immutable')
import {renderMenuButton, renderLoginButton, renderSearchCalendarButton, renderUserProfileButton} from '../helpers/navigator'
import {inflateListing} from '../helpers/listing/utils'
import {main as Profile} from './profile/main'
import {main as Invalid} from './invalid'

const routes = [
  {pattern: /^\/\d*$/, value: {type: "success"}},
  {pattern: /^\/notFound$/, value: {type: "error"}},
  {pattern: /.*/, value: {type: "error"}}
]

const Loader = () => ({
  DOM: O.of(undefined)
})

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function drillInflate(result) {
  // console.log(result)
  result.listing = inflateListing(result.listing)
  result.children.map(inflateListing)
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `getListingById`)
  const listing$ = good$
    .do(x => console.log(`got listing`, x))
    .filter(onlySuccess)
    .pluck(`data`)
    .map(drillInflate)
    .publish().refCount()
  
  const not_found$ = good$
    .filter(onlyError)
    .pluck(`data`)
    .publish().refCount()

  const show_menu$ = DOM.select(`.appShowMenuButton`).events(`click`)
  const brand_button$ = DOM.select(`.appBrandButton`).events(`click`)
  return {
    listing$,
    not_found$,
    show_menu$,
    brand_button$
  }
}


function renderNavigator(state) {
  const {authorization} = state
  const authClass = authorization ? 'Logout' : 'Login'
  return nav('.navbar.navbar-light.bg-faded.container-fluid.pos-f-t', [
    div('.row.no-gutter', [
      div('.col-xs-6', [
        a('.btn.btn-link', {attrs: {href: '/'}}, [
          span({style: {display: "table"}}, [
            span('.appBackToSearch.fa.fa-2x.fa-angle-left.mr-1', []),
            span({style: {display: "table-cell", "vertical-align": "middle"}}, ['Back to search'])
          ])
        ])
      ]),
      // div('.col-xs-2', {style: {"text-align": "center"}},  [
      //   div('.hopscotch-icon.btn.btn-link.nav-brand', []),
      // ]),
      div('.col-xs-6', [
        button('.appShowMenuButton.nav-text-button.fa.fa-bars.btn.btn-link.float-xs-right', []),
      ]),
    ])
  ])
}


function view(authorization, components) {
  return combineObj({authorization, components: combineObj(components)})
    .map((info: any) => {
      const {authorization, components} = info
      return div('.screen', [
        renderNavigator({authorization}),
        components.content ? div('.content-section.listing-profile', [
          components.content
        ]) : span('.loader')
      ])
    })
}


export default function main(sources, inputs): any {
  const {Router} = sources
  const actions = intent(sources)

  const route$ = Router.define(routes).publishReplay(1).refCount()

  const success$ = route$
    .filter(route => route.value.info.type === 'success')
    .publishReplay(1).refCount()

  const error$ = route$
    .filter(route => route.value.info.type === 'error')
    

  const invalid$ = error$.map(x => Invalid(sources, inputs))

  const send_to_http$ = success$
    .filter(route => !route.location.state)
    .publishReplay(1).refCount()

  const waiting$ = send_to_http$.map(_ => {
    return Loader()
  })

  const profile$ = success$
    .filter(route => route.location.state)
    .map(route => {
      return Profile(
        {...sources, Router: Router.path(route.path.substring(1))}, 
        {...inputs, props$: O.of(drillInflate(route.location.state))}
      )
    })

  const content$ = O.merge(profile$, invalid$, waiting$).publishReplay(1).refCount()

  const content = componentify(content$)

  const to_router$ = O.merge(
    actions.listing$.map(result => { 
      //return //[
        //{action: 'pop'}, 
        return {
          type: 'replace',
          action: 'REPLACE',
          state: result,
          pathname: '/listing/' + result.listing.id
        }
      //]
    }), 
    actions.not_found$.map(message => {
      //return //[
        //{action: 'pop'}, 
        return {
          type: 'replace',
          action: 'REPLACE',
          state: message,
          pathname: '/listing/notFound'
        }
      //]
    })//.switchMap(x => O.from(x))
  )

  const to_http$ = send_to_http$
    .map(route => route.path.substring(1))
    .map(listing_id => {
      return {
          url: `/api/user`,
          method: `post`,
          send: {
            route: "/retrieve_listing",
            data: listing_id
          },
          category: `getListingById`
      }
    })
    .do(x => console.log(`retrieve listing toHTTP`, x))


  return {
    ...content,
    DOM: view(inputs.Authorization.status$, {content: content.DOM}),
    HTTP: O.merge(content.HTTP, to_http$),
    Router: O.merge(content.Router, to_router$, actions.brand_button$.mapTo('/')),
    MessageBus: actions.show_menu$.mapTo({to: `main`, message: `showLeftMenu`})
  }
}