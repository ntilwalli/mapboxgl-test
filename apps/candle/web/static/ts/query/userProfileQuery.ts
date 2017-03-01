import {Observable as O} from 'rxjs'
import {processHTTP} from '../utils'

const category = 'userProfileQuery'

export default function main(sources, {props$}) {
  const to_http$ = props$.map(username => {
    return {
      url: '/api/user',
      method: 'post',
      send: {
        route: '/profile/retrieve',
        data: username
      },
      category
    } 
  }).publish().refCount()

  const response = processHTTP(sources, category)

  return {
    HTTP: to_http$.delay(1),
    error$: response.error$,
    success$: response.success$,
    waiting$: O.merge(
      to_http$.mapTo(true), 
      O.merge(response.error$, response.success$).mapTo(false)
    )
  }
}