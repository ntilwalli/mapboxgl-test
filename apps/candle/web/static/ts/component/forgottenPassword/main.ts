import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, mergeSinks, componentify} from '../../utils'
import queryString = require('query-string')
import Navigator from '../../library/navigators/simple'

function intent(sources) {
  const {Router, Storage} = sources

  const url_params$ = Router.history$
    //.do(x => console.log(`history$`, x))
    .map(x => {
      return queryString.parse(x.search)
    })
    .publishReplay(1).refCount()

  const token$ = sources.Storage.local.getItem('forgottenPasswordToken')
    .take(1)
    .publishReplay(1).refCount()


  return {
    url_params$,
    with_token$: token$.filter(Boolean),
    without_token$: token$.filter(x => !x)
  }
}

function view(components) {
  return combineObj(components)
    .map((components: any) => {
      return div('.screen.forgotten-password', [
        components.navigator,
        components.content
      ])
    })
}

  // const to_storage$ = O.merge(
  //   O.merge(
  //     actions.login$, 
  //     actions.signup$
  //   ).withLatestFrom(state$, (_, state: any) => {
  //     return {
  //       action: `setItem`,
  //       key: `create_listing_session`,
  //       value: JSON.stringify(state.session)
  //     }
  //   }),


export default function main(sources, inputs) {
  const actions = intent(sources)
  const navigator = Navigator(sources, inputs)
  const content$ = O.merge(
    actions.with_token$.map(x => {
      return {
        DOM: O.of(div(['Forgotten password with token']))
      }
    }),
    actions.without_token$.map(x => {
      return {
        DOM: O.of(div(['Forgotten password without token']))
      }
    })
  ).publishReplay(1).refCount()

  const content = componentify(content$)
  const components = {
    navigator: navigator.DOM,
    content: content.DOM
  }
  const vtree$ = view(components)
  const merged = mergeSinks(navigator)
  return {
    ...merged,
    DOM: O.merge(
      actions.url_params$,
      vtree$
    )
  }
}

