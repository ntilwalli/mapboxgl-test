import {Observable as O} from 'rxjs'
import moment from 'moment'
import {combineObj, spread} from '../utils'
import Immutable from 'immutable'
import ParseAddress from 'parse-address'
import {countryToAlpha2} from '../util/countryCodes'
import {getState} from '../util/states'


const geocodeUrlPrefix = `http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates`
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
    .map(x => x.data)
    .map(x => {
      let match
      let searchArea
      if (match = x.address.match(/^(.*),(.*),(.*)$/)) {
        const city = match[1].trim()
        const state = match[2].trim()
        const country = match[3].trim()
        searchArea = {
          region: {
            source: `ArcGIS`,
            type: `somewhere`,
            data: {
              parsedAddress: x.parsedAddress,
              raw: x.address,
              city: city,
              state: state,
              country: country,
              cityAbbr: undefined,
              stateAbbr: getState(state),
              countryAbbr: countryToAlpha2(country)
            }
          },
          center: x.latLng
        }
      } else if (match = x.address.match(/^(.*),(.*)$/)) {
        const state = match[1].trim()
        const country = match[2].trim()
        searchArea = {
          region: {
            source: `ArcGIS`,
            type: `somewhere`,
            data: {
              parsedAddress: x.parsedAddress,
              raw: x.address,
              city: undefined,
              state: state,
              country:  country,
              cityAbbr: undefined,
              stateAbbr: getState(state),
              countryAbbr: countryToAlpha2(country)
            }
          },
          center: x.latLng
        }
      } else {
        searchArea = {
          region: {
            source: `ArcGIS`,
            type: `somewhere`,
            data: {
              parsedAddress: x.parsedAddress,
              raw: x.address,
              city: undefined,
              state: undefined,
              country: undefined,
            }
          },
          center: x.latLng
        }
      }

      return searchArea
    })



  return {
    HTTP: toHTTP$,
    result$,
    error$
  }
}

export default ArcGISGetMagicKey