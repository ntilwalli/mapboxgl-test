import {Observable as O} from 'rxjs'
import {combineObj} from '../utils'

function getCategory(props) {
  if (!props || !props.category) {
    throw new Error(`Geotag service props.category required.`)
  }

  return props.category
}

function toGeotagHTTPRequest(props, position) {
  return {
    url: `/api/geotag`,
    method: 'post',
    type: 'json',
    send: position,
    category: getCategory(props)
  }
}

function getFromHTTPStream (props$, HTTP) {

  return props$.switchMap(props => {
      return HTTP.select(getCategory(props))
    }).switchMap(res$ => res$
      .map(res => {
        if (res.statusCode === 200) {
          const body = res.body
          if (body.type === "success") {
            const parsed = JSON.parse(body.data).response.data
            return {
              type: `success`,
              data: parsed
            }
          } else {
            return body
          }
        } else {
          return {
            type: `error`,
            data: `Unsuccessful response from server`
          }
        }
      })
      .catch((e, orig$) => {
        return O.of({type: `error`, data: e})
      })
    )
    .filter(x => x.type === `success`)
    .map(x => x.data)
}


export default function FactualGeotagService ({props$, lngLat$, HTTP}) {
  const sharedProps$ = props$.publishReplay(1).refCount()
  const fromHTTP$ = getFromHTTPStream(sharedProps$, HTTP)
    .publish().refCount()
  const toHTTP$ = lngLat$.withLatestFrom(sharedProps$, (lngLat, props) => {
    return toGeotagHTTPRequest(props, lngLat)
  }).publish().refCount()

  return {
    HTTP: toHTTP$.delay(4),
    waiting$: O.merge(
        fromHTTP$.map(() => false),
        toHTTP$.map(() => true)
      ).startWith(false),
    result$: fromHTTP$.publish().refCount()
  }
}
