import {Observable as O} from 'rxjs'
import queryString = require('query-string')

function intent(sources) {
  const {DOM, Router, MessageBus} = sources

  const url_params$ = Router.history$
    //.do(x => console.log(`history$`, x))
    .map(x => queryString.parse(x.search))
    .publishReplay(1).refCount()
  const modal$ = url_params$.map(x => x.modal).map(x => {
      return (x === `login` || x === `signup` || x === `presignup` || x === 'forgotten') ? {type: x, data: undefined} : null
    }).publishReplay(1).refCount()
  const mb_main$ = MessageBus.address(`main`)

  const show_menu$ = mb_main$.filter(x => {
      //console.log('testing left menu modal')
      return x.type === `showLeftMenu`
    })
    .map(x => ({type: `leftMenu`, data: x.data}))
  const show_login$ = mb_main$.filter(x => x.type === `showLogin`)
    .map(x => ({type: `login`, data: x.data}))
  const show_signup$ = mb_main$.filter(x => x.type === `showSignup`)
    .map(x => ({type: `signup`, data: x.data}))

  const show_forgotten$ = mb_main$.filter(x => x.type === `showForgotten`)
    .map(x => ({type: `forgotten`, data: x.data}))
  
  const show_modal$ = O.merge(modal$, show_menu$, show_login$, show_signup$, show_forgotten$)

  const hide_modal$ = mb_main$.filter(x => x === `hideModal`)
  const main_error$ = mb_main$.filter(x => x.type === 'error').map(x => x.data)


  const main_messages$ = Router.history$
    .map(route => route.state ? route.state.messages : undefined)
    .filter(Boolean)
    
  const clear_message$ = DOM.select('.appRemoveMainMessageButton').events('click')
    .map(ev => {
      return ev.target.dataset.index
    })

  return {
    show_modal$,
    hide_modal$,
    url_params$,
    main_error$,
    main_messages$,
    clear_message$
  }
}

export default intent