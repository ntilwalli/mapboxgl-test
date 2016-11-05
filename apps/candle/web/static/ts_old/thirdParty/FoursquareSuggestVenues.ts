import {Observable as O} from 'rxjs'
import moment = require('moment')
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
    type: `text/plain`,
    category: `suggestVenues`
  }

}

function FoursquareSuggestVenues (sources, inputs) {
  const {HTTP} = sources
  const {props$, input$, centerZoom$} = inputs


  const fromHttp$ = HTTP.select(`suggestVenues`)
    // .do(x => console.log(`all responses...`, x))
    // .filter(res$ => res$.request && res$.request.category === `suggestVenues`)
    //.filter(res$ => res$.request.url.indexOf(`suggestcompletion`) > -1)
    .switchMap(res => {
      return res.map(res => {
        if (res.statusCode === 200) {
          //console.log(`recieved HTTP response`)
          return {
            type: `success`,
            data: res.body.response
          }
        } else {
          //console.log(`recieved HTTP error`)
          return {
            type: `error`,
            data: `Unsuccessful response from server`
          }
        }
      })
      .catch((e, orig$) => {
        //console.log(`received HTTP major error`)
        return O.of({
          type: `error`,
          data: e
        })
      })
    })
    .publish().refCount()
    //.publishReplay(1).refCount()

  const validResponse$ = fromHttp$.filter(res => res.type === `success`).map(res => res.data)
  const invalidResponse$ = fromHttp$.filter(res => res.type === `error`).map(res => res.data)

  const minivenues$ = validResponse$
    .map(res => res.minivenues)
    .map(results => results.map(result =>({
      source: `Foursquare`,
      data: {
        name: result.name,
        address: [result.location.address, result.location.state, result.location.postalCode].join(`, `),
        venueId: result.id,
        lngLat: {lat: result.location.lat, lng: result.location.lng},
        raw: result
      }
    })))

  const sharedPartial$ = input$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const sendablePartial$ = sharedPartial$
    .filter(x => {
      return x.length >= 3
    })
    //.do(x => console.log('sendablePartial$...', x))

  const unsendablePartial$ = sharedPartial$.filter(x => {
    return x.length < 3
  })
  const emptyResult$ = O.merge(invalidResponse$, unsendablePartial$)
    .map(() => [])//.do(makeLogger('emptyResult$...'))

  //const rProps$ = props$.publishReplay(1).refCount()

  const toHttp$ = sendablePartial$.withLatestFrom(
    combineObj({props$, centerZoom$}),
    (partial, info) => ({props: info.props, partial, centerZoom: info.centerZoom})
  ).map(toHTTP) // need to add cancellation
   .publishReplay(1).refCount()

  const results$ = O.merge(
    minivenues$.map(venues => venues.map(x => {
      x.type = `default`
      return x
    })),
    emptyResult$
  )
  .publish().refCount()
  //.publishReplay(1).refCount()

  return {
    HTTP: toHttp$,
      //.do(x => console.log(`toHTTP$`, x)),
    results$,
    //results$: O.never(),
    isProcessing$: O.merge(
      fromHttp$.map(() => false),
      toHttp$.map(() => true)
    ).startWith(false),
    error$: invalidResponse$.map(x => [`Got a venue suggestion response error`])
  }
}

export default FoursquareSuggestVenues
