import {Observable as O} from 'rxjs'
import moment from 'moment'
import {combineObj, spread} from '../utils'
import Immutable from 'immutable'
import ParseAddress from 'parse-address'


const geocodeUrlPrefix = `http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates`
const defaultCategory = `ArgGISGetMagicKey`

function toRequest({name, magicKey}) {
	const url = `${geocodeUrlPrefix}?singleLine=${name}&&f=json&magicKey=${magicKey}`

  return  {
    url: url,
    method: `get`,
    type: `text/plain`, //'json'
		category: defaultCategory
  }

}

function ArcGISGetMagicKey(sources, inputs) {
  const {input$} = inputs

  const toHTTP$ = input$
    .map(input => {
      return toRequest(input)
    }).delay(4)

  const response$ = sources.HTTP.select(defaultCategory)
    .switchMap(res$ => res$
      .map(res => {
        // console.log(`response`)
        // console.log(res)
        if (res.statusCode === 200) {
          const respData = JSON.parse(res.text)
          if (respData.candidates.length > 0) {
            const candidate = respData.candidates[0]
            const parsedAddress = ParseAddress.parseLocation(candidate.address)
            return {
              type: `success`,
              data: {
                address: candidate.address,
                parsedAddress,
                latLng: {
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
  const result$ = response$
    .filter(x => x.type === `success`)


  return {
    HTTP: toHTTP$,
    result$,
    error$
  }
}

export default ArcGISGetMagicKey