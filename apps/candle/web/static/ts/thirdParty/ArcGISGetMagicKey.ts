import {Observable as O} from 'rxjs'
import moment = require('moment')
import {combineObj, spread, clean} from '../utils'
import Immutable = require('immutable')
//import {parseLocation} from 'parse-address'
//import {countryToAlpha2} from '../util/countryCodes'
import {getState} from '../states'


const geocodeUrlPrefix = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates`
const defaultCategory = `ArgGISGetMagicKey`

function toRequest({category}, {name, magicKey}) {
	const url = `${geocodeUrlPrefix}?singleLine=${name}&&f=json&magicKey=${magicKey}`

  return  {
    url: url,
    method: `get`,
    type: `text/plain`, //'json'
		category
  }

}

function ArcGISGetMagicKey(sources, inputs) {
  const {input$, props$} = inputs
  const sharedProps$ = props$.publishReplay(1).refCount()

  const toHTTP$ = sharedProps$.switchMap(props => input$
    .map(input => {
      return toRequest(props, input)
    }).delay(4)
  )

  const response$ = props$
    .switchMap(props => sources.HTTP.select(props.category))
    .switchMap(res$ => res$
      .map((res): any => {
        // console.log(`response`)
        // console.log(res)
        if (res.statusCode === 200) {
          const respData = JSON.parse(res.text)
          if (respData.candidates.length > 0) {
            const candidate = respData.candidates[0]
            //const parsedAddress = parseLocation(candidate.address)
            return {
              type: `success`,
              data: {
                address: clean(candidate.address),
                //parsedAddress,
                lngLat: {
                  lat: candidate.location.y,
                  lng: candidate.location.x
                }
              }
            }
          } else {
            return {
              type: `error`,
              data: `No candidates found`
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
    .publish().refCount()

  const error$ = response$
    .filter(x => x.type === `error`)
    .map(x => [x.data])
    .publish().refCount()
  const result$ = response$
    .filter(x => x.type === `success`)
    .map(x => x.data)
    .publish().refCount()

  const waiting$ = O.merge(
    toHTTP$.mapTo(true),
    O.merge(result$, error$).mapTo(false)
  ).startWith(false).publishReplay(1).refCount()

  return {
    HTTP: toHTTP$,
    result$,
    error$,
    waiting$
  }
}

export default ArcGISGetMagicKey