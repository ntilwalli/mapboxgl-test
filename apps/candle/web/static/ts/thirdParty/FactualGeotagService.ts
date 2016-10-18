import {Observable as O} from 'rxjs'
import {combineObj} from '../utils'

const geoTagUrl = `https://api.factual.com/geotag`
const factualKey = `99aLr5p8dp2AjzpGNGLMpc4NTWJx07UWbKl34ALW`
//
function getGeotagUrl () {
  return geoTagUrl
}

function toGeotagHTTPRequest (props, position) {
  const {lat, lng} = position
  const url = `${geoTagUrl}?latitude=${lat}&longitude=${lng}&KEY=${factualKey}`
  return {
    url,
    type: 'application/json',
    category: props && props.category || undefined
  }
}


function getFromHTTPStream (props$, HTTP) {

  return props$.switchMap(props => {
      return HTTP.select(props.category)
    }).switchMap(res$ => res$
      .map(res => {
        // console.log(`geotag response`)
        // console.log(res)
        if (res.statusCode === 200) {
          //const respData = JSON.parse(res.text)
          return {
            type: `success`,
            data: res.body.response.data
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
      })//.publish().refCount()
    )
    .filter(x => x.type === `success`)
    .map(x => x.data)
    .map(x => {
      if (x.country && x.locality && x.region) {
        return {
          source: `factual`,
          type: `somewhere`,
          data: {
            country: x.country.name,
            locality: x.locality.name,
            region: x.region.name
          }
        }
      } else {
        return {
          source: `factual`,
          type: `nowhere`,
          data: x
        }
      }
    })
}


export default function FactualGeotagService ({props$, lngLat$, HTTP}) {
  const sharedProps$ = props$.publishReplay(1).refCount()
  const fromHTTP$ = getFromHTTPStream(sharedProps$, HTTP)
    .publish().refCount()
  const toHTTP$ = lngLat$.withLatestFrom(sharedProps$, (lngLat, props) => {
    return toGeotagHTTPRequest(props, lngLat)
  }).publish().refCount()

  return {
    HTTP: toHTTP$,
    isProcessing$: O.merge(
        fromHTTP$.map(() => false),
        toHTTP$.map(() => true)
      ).startWith(false),
    result$: fromHTTP$.filter(x => x.type !== `error`)
      .publish().refCount(),
    error$: fromHTTP$.filter(x => x.type === `error`)
      .publish().refCount()
  }
}
