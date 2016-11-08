import {Observable as O} from 'rxjs'
import moment = require('moment')
import {combineObj} from '../utils'
import Immutable = require('immutable')

const suggestUrlPrefix = `http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/geocodeAddresses`
const defaultCategory = "ArgGISGeocode"
const token = "hVIDetwZKdBrLpYvfLb0kQCD_WrqkGVES5xtl_mJsB3xNxUHlfmF-ykDhjiB2o2qCQGnAbsRj0AZgtNENULwaTtL5LPFY07rsAz48P9g0iP_WH5-CHnrLcbPwcgqGahYuvX2AM5c3mkXl9LC1KVP2Q.."
function getCategory(props) {
  return props.category || defaultCategory
}

function toRequest({props, address}) {
  const parameters = []
  parameters.push(["addresses", JSON.stringify({
      records: [{
        attributes: {
          OBJECTID: 1,
          SingleLine: address
        }
      }]
    
  })].join("="))
  parameters.push(["f", "json"].join("="))
  parameters.push(["token", token].join("="))
  parameters.push(["countryCode", props.countryCode || "US"].join("="))
  const url = suggestUrlPrefix + "?" + parameters.join('&')

  //console.log(url)
  return  {
    url: url,
    method: "get",
    type: "text/plain",
    category: getCategory(props)
  }
}

function ArcGISGeocode (sources, inputs) {
  const {props$, address$} = inputs
  const sharedProps$ = props$.publishReplay(1).refCount()

  const withLatestInput$ = address$.withLatestFrom(sharedProps$,
    (address, props) => ({props: props || {}, address}))

  const toHTTP$ = withLatestInput$
    .map(x => {
      return toRequest(x)
    }).delay(4)

  const suggestionsResponse$ = sharedProps$.switchMap(props => {
    return sources.HTTP.select(getCategory(props))
      .switchMap(res$ => res$
        .map(res => {
          if (res.statusCode === 200) {
            const respData = JSON.parse(res.text)
            if (respData.error) {
              return {
                type: `error`,
                data: respData.error
              }
            } else {
              if (respData.locations.length) {
                const loc = respData.locations[0].location
                return {
                  type: `success`,
                  data: {lat: loc.y, lng: loc.x}
                }
              } else {
                return {
                  type: `error`,
                  data: `Zero results returned`
                }
              }
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
    })
    .publish().refCount()

  const error$ = suggestionsResponse$
    .filter(x => x.type === `error`)
    .map(x => [x.data])
    .publish().refCount()
  const results$ = suggestionsResponse$
    .filter(x => x.type === `success`)
    .map(x => {
      return x.data
    })
    .publish().refCount()

  return {
    HTTP: toHTTP$,
    results$,
    error$
  }
}

export default ArcGISGeocode