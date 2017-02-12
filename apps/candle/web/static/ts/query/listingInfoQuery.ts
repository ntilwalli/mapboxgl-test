import {Observable as O} from 'rxjs'
import {processHTTP} from '../utils'

const category = 'listingInfoQuery'

export default function main(sources, {props$}) {
  const to_http$ = props$.map(request => {
    return {
      url: '/api/user',
      method: 'post',
      send: {
        route: '/listing/info_query',
        data: request
      },
      category
    } 
  }).publish().refCount()

  const response = processHTTP(sources, category)

  // response.success$.subscribe()
  // response.error$.subscribe()

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
