import {Observable as O} from 'rxjs'
import queryString = require('query-string')

function intent(sources) {
  const {Router, MessageBus} = sources

  const url_params$ = Router.history$
    //.do(x => console.log(`history$`, x))
    .map(x => queryString.parse(x.search))
    .publishReplay(1).refCount()
  const modal$ = url_params$.map(x => x.modal).map(x => {
      return (x === `login` || x === `signup` || x === `presignup`) ? {type: x, data: undefined} : null
    }).publishReplay(1).refCount()

  const show_menu$ = MessageBus.address(`main`).filter(x => {
    console.log('testing left menu modal')
    return x.type === `showLeftMenu`
  })
    .map(x => ({type: `leftMenu`, data: x.data}))
  const show_login$ = MessageBus.address(`main`).filter(x => x.type === `showLogin`)
    .map(x => ({type: `login`, data: x.data}))
  const show_signup$ = MessageBus.address(`main`).filter(x => x.type === `showSignup`)
    .map(x => ({type: `signup`, data: x.data}))
  
  const show_modal$ = O.merge(modal$, show_menu$, show_login$, show_signup$)

  const hide_modal$ = MessageBus.address(`main`).filter(x => x === `hideModal`)

  return {
    show_modal$,
    hide_modal$,
    url_params$
  }
}

export default intent