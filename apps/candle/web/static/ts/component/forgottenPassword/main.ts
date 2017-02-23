import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, mergeSinks, componentify} from '../../utils'
import queryString = require('query-string')
import Navigator from '../../library/navigators/simple'
import Reset from './reset'

function intent(sources) {
  const {Router, Storage} = sources

  const url_token$ = Router.history$
    .map(x => {
      const params: any =  queryString.parse(x.search)
      const token = params.token
      return token
    })
    .publishReplay(1).refCount()

  const local_token$ = sources.Storage.local.getItem('forgotten_password_token')
    .take(1)
    .publishReplay(1).refCount()


  return {
    with_url_token$: url_token$.filter(Boolean).publishReplay(1).refCount(),
    without_url_token$: url_token$.filter(x => !x),
    with_local_token$: local_token$.filter(Boolean),
    without_local_token$: local_token$.filter(x => !x)
  }
}

function view(components) {
  return combineObj(components)
    .map((components: any) => {
      return components.content
    })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const navigator = Navigator(sources, inputs)
  const content$ = O.merge(
    actions.with_local_token$.map(token => {
      return Reset(sources, {...inputs, props$: O.of(token)})
    }),
    actions.without_url_token$.switchMap(_ => actions.without_local_token$.map(x => {
      return {
        Router: O.of({
          pathname: '/',
          type: 'replace'
        }).delay(1)
      }
    }))
  ).publishReplay(1).refCount()

  const content = componentify(content$)
  const components = {
    navigator: navigator.DOM,
    content: content.DOM
  }

  const vtree$ = view(components)

  const to_storage$ = 
      actions.with_url_token$
        .map(token => {
          return {
            action: `setItem`,
            key: `forgotten_password_token`,
            value: token
          }
        })

  const merged = mergeSinks(navigator, content)
  return {
    ...merged,
    DOM: vtree$,
    Storage: O.merge(
      merged.Storage,
      to_storage$
    ),
    Router: O.merge(
      merged.Router,
      actions.with_url_token$.mapTo({
        pathname: '/i/forgotten',
        type: 'replace'
      })
    )
  }
}

