import {Observable as O} from 'rxjs'
import moment from 'moment'
import {combineObj} from '../utils'

const foursquareClientId = "1JNLTA55YBKWF1GXHJEBBA0YKZVDDBHDDGSPK1NDI3DYGC3D"
const foursquareClientSecret = "QCCBUXCGVW1CZN231TR5INZHXIDFD1YHGZRFIX2WW5U5XSCG"

function toHTTP({props, partial, centerZoom}) {
  //console.log(`foursquare toHTTP`)
  const parameters = []
  const lat = centerZoom.center.lat
  const lng = centerZoom.center.lng

  parameters.push([`query`, partial].join(`=`))
  if (centerZoom) parameters.push([`ll`, `${lat},${lng}`].join(`=`))
  parameters.push([`limit`, props.maxSuggestions || 5].join(`=`))
  parameters.push([`client_id`, foursquareClientId].join(`=`))
  parameters.push([`client_secret`, foursquareClientSecret].join(`=`))
  parameters.push([`v`, moment().format('YYYYMMDD')].join(`=`))
  //parameters.push([`radius`, props.radius || 10000].join(`=`))

	const url = `https://api.foursquare.com/v2/venues/suggestcompletion?${parameters.join(`&`)}`
  //console.log(url)

  return  {
    url: url,
    //method: `get`,
    type: `text/plain`
  }

}

function FoursquareSuggestVenues (sources, inputs) {
  const {HTTP} = sources
  const {props$, input$, centerZoom$} = inputs


  const fromHttp$ = HTTP.response$$
    .filter(res$ => res$.request.url.indexOf(`suggestcompletion`) > -1)
    .switchMap(res => {
      return res.map(res => {
        if (res.statusCode === 200) {
          return {
            type: `success`,
            data: res.body.response
          }
        } else {
          return {
            type: `error`,
            data: `Unsuccessful response from server`
          }
        }
      })
      .catch((e, orig$) => {
        return O.of({
          type: `error`,
          data: e
        })
      })
    })
    .cache(1)

  const validResponse$ = fromHttp$.filter(res => res.type === `success`).map(res => res.data)
  const invalidResponse$ = fromHttp$.filter(res => res.type === `error`).map(res => res.data)

  const minivenues$ = validResponse$
    .map(res => res.minivenues)
    .map(results => results.map(result =>({
      name: result.name,
      address: [result.location.address, result.location.state, result.location.postalCode].join(`, `),
      venueId: result.id,
      latLng: [result.location.lat, result.location.lng],
      source: `Foursquare`,
      retrieved: (new Date()).getTime()
    })))

  const sharedPartial$ = input$
    .map(x => {
      return x
    })
    .cache(1)
  const sendablePartial$ = sharedPartial$.filter(x => {
    return x.length >= 3
  })//.do(makeLogger('sendablePartial$...'))
  const unsendablePartial$ = sharedPartial$.filter(x => {
    return x.length < 3
  })
  const emptyResult$ = O.merge(invalidResponse$, unsendablePartial$)
    .map(() => [])//.do(makeLogger('emptyResult$...'))

  const rProps$ = props$.cache(1)
  const rCenterZoom$ = centerZoom$.cache(1)

  //const test$ = combineObj({props$, centerZoom$}).cache(1)
  const toHttp$ = sendablePartial$
    .switchMap(partial => {
      return combineObj({props$: rProps$.take(1), centerZoom$: rCenterZoom$.take(1)})
        .map(({props, centerZoom}) => ({props, partial, centerZoom}))
    }) // with latest from idiom
    .map(toHTTP) // need to add cancellation
    .cache(1)

  return {
    HTTP: toHttp$,
    results$: O.merge(
      minivenues$.map(venues => venues.map(x => {
        x.type = `default`
        return x
      })),
      emptyResult$
    ),
    isProcessing$: O.merge(
      fromHttp$.map(() => false),
      toHttp$.map(() => true)
    ).startWith(false),
    error$: invalidResponse$.map(x => [`Got a venue suggestion response error`])
  }
}

export default FoursquareSuggestVenues
