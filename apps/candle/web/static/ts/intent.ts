import {Observable as O} from 'rxjs'
import queryString = require('query-string')

function intent(sources) {
  const {Router, MessageBus} = sources

  const url_params$ = Router.history$
    //.do(x => console.log(`history$`, x))
    .map(x => queryString.parse(x.search))
    .publishReplay(1).refCount()
  const modal$ = url_params$.map(x => x.modal).map(x => {
      return (x === `login` || x === `signup` || x === `presignup` || x === `vicinity`) ? x : null
    }).publishReplay(1).refCount()

  const show_menu$ = MessageBus.address(`main`).filter(x => x === `showLeftMenu`)
    .mapTo(`leftMenu`)
  const show_login$ = MessageBus.address(`main`).filter(x => x === `showLogin`)
    .mapTo(`login`)
  const show_signup$ = MessageBus.address(`main`).filter(x => x === `showSignup`)
    .mapTo(`signup`)
  const show_settings$ = MessageBus.address(`main`).filter(x => x === `showSettings`)
    .mapTo(`settings`)
  
  const show_modal$ = O.merge(modal$, show_menu$, show_login$, show_signup$, show_settings$)

  const hide_modal$ = MessageBus.address(`main`).filter(x => x === `hideModal`)

  return {
    show_modal$,
    hide_modal$,
    url_params$
  }
}

export default intent