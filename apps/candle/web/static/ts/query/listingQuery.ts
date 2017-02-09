import {Observable as O} from 'rxjs'
import {processHTTP} from '../utils'

const category = 'listingQuery'

export default function main(sources, {props$}) {
  const to_http$ = props$.map(request => {
    return {
      url: '/api/user',
      method: 'post',
      send: {
        route: '/listing/query',
        data: request
      },
      category: 'listingQuery'
    } 
  })

  const response = processHTTP(sources, 'listingQuery')

  // response.success$.subscribe()
  // response.error$.subscribe()

  return {
    HTTP: to_http$.delay(1),
    MessageBus: response.error$
      .map(status => {
        return {
          to: 'main', message: {
            type: 'error', 
            data: status
          }
        }
      }),
    output$: response.success$,

  }
}
