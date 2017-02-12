import {Observable as O} from 'rxjs'
import {processHTTP} from '../utils'

const category = 'listingUpdateQuery'

export default function main(sources, {props$}) {
  const to_http$ = props$.map(request => {
    return {
      url: '/api/user',
      method: 'post',
      send: {
        route: '/listing/update',
        data: request
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