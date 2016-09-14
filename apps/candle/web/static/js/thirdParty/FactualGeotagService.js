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

function getResponseStream(props, HTTP) {
  return HTTP.select(props.category)
}


function getFromHTTPStream (props, HTTP) {

  return getResponseStream(props, HTTP)
      .switchMap(res$ => res$
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
        })
      )
      .filter(x => x.type === `success`)
      .map(x => x.data)
      .map(x => {
        if (x.country && x.locality && x.region) {
          return {
            type: `somewhere`,
            data: {
              country: x.country.name,
              locality: x.locality.name,
              region: x.region.name
            }
          }
        } else {
          return {
            type: `nowhere`
          }
        }
      })
}





export default function FactualGeotagService ({props$, latLng$, HTTP}) {
  const info$ = combineObj({props$: props$ || O.of({}), latLng$}).map(({props, latLng}) => {
    return {
      result$: getFromHTTPStream(props, HTTP),
      HTTP: O.of(toGeotagHTTPRequest(props, latLng))
    }
  }).publish().refCount()

  return {
    HTTP: info$.switchMap(x => x.HTTP),
    result$: info$.switchMap(x => x.result$)
  }
}
