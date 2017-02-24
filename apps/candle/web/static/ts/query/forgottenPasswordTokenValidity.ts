import {Observable as O} from 'rxjs'
import {processHTTP} from '../utils'

const category = 'tokenValidityQuery'

export default function main(sources, {props$}) {
  const to_http$ = props$.map(request => {
    return {
      url: '/api_auth/verify_forgotten_password_token',
      method: 'post',
      send: request,
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