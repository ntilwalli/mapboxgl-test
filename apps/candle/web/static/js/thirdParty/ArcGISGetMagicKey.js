import {Observable as O} from 'rxjs'
import moment from 'moment'
import {combineObj, spread} from '../utils'
import Immutable from 'immutable'
import ParseAddress from 'parse-address'

const geocodeUrlPrefix = `http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates`
const defaultCategory = `ArgGISGetMagicKey`
function toGeocodeHTTP({name, magicKey}) {
	const url = `${geocodeUrlPrefix}?singleLine=${name}&&f=json&magicKey=${magicKey}`

  return  {
    url: url,
    method: `get`,
    type: `text/plain`, //'json'
		category: defaultCategory
  }

}

function isValidGeocodeResponse (url, suggestions) {
  for (let key in suggestions.toObject()) {
    const suggestion = suggestions.get(key)
    if (suggestion.req.url === url) {
      return true
    }
  }

  return false
}



function getResults ({HTTP}, {input$}) {
  const output$ = input$
    .map(input => {
      const magicKeyRequest = toGeocodeHTTP(input)
      const magicKeyRequest$ = O.of(magicKeyRequest)
      const magicKeyUrl = magicKeyRequest.url

      //console.log(`suggestions url ${suggestionsUrl}`)
      const magicKeyResponse$ = HTTP.select(defaultCategory)
        // .filter(res$ => {
				// 	const url = res$.request.url
				// 	const isValid = url === magicKeyUrl
				// 	return isValid
				// })
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


      const magicKeyError$ = magicKeyResponse$.filter(x => x.type === `error`).map(x => [x.data])
      const magicKeySuccess$ = magicKeyResponse$
        .filter(x => x.type === `success`)
        // .tap(x => {
        //   console.log(`magicKeySuccess$...`)
        //   console.log(x)
        // })


      return {
        HTTP: O.merge(
          magicKeyRequest$
        ),
        result$: magicKeySuccess$,
        error$: magicKeyError$
      }
    })

    return output$
}

function ArcGISGetMagicKey (sources, inputs) {

  const streams$ = getResults(sources, inputs).cache(1)

  return {
    HTTP: streams$.switchMap(x => x.HTTP),//.do(makeLogger('toHTTP$..')),
    result$: streams$.switchMap(x => x.result$),
    error$: streams$.switchMap(x => x.error$)
  }
}

export default ArcGISGetMagicKey
