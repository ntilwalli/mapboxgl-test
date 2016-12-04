import {Observable as O} from 'rxjs'
import moment = require('moment')
import {combineObj, clean, normalizeArcGISSingleLineToString} from '../utils'
import Immutable = require('immutable')

const suggestUrlPrefix = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest`
const defaultCategory = "ArgGISSuggest"

function toRequest({props, input, center}) {
  const parameters = []
  parameters.push(["text", input].join("="))
  parameters.push(["f", "json"].join("="))
  parameters.push(["location", "" + center.lng + "," + center.lat].join("="))

  parameters.push(["maxSuggestions", props.maxSuggestions || 5].join("="))
  parameters.push(["category", props.category || "Populated+Place"].join("="))
  parameters.push(["distance", props.distance || 10000].join("="))
  parameters.push(["countryCode", props.countryCode || "US"].join("="))

  const url = suggestUrlPrefix + "?" + parameters.join('&')

  return  {
    url: url,
    method: "get",
    type: "text/plain",
    category: props.category || defaultCategory
  }
}

function ArcGISSuggest (sources, inputs) {
  const {props$, input$, center$} = inputs
  const sharedProps$ = props$.publishReplay(1).refCount()

  const filteredInput$ = input$
    //.do(x => console.log(`received input`, x))
    .filter(x => x.length)

  const withLatestInput$ = filteredInput$.withLatestFrom(combineObj({
    props$: sharedProps$,
    center$
  }), (input, info) => ({props: info.props, input, center: info.center}))

  const toHTTP$ = withLatestInput$
    .map(({props, input, center}) => {
      return toRequest({props: props || {}, input, center})
    })
    //.do(x => console.log(`to http`, x))

  const suggestionsResponse$ = sharedProps$.switchMap(props => {
    return sources.HTTP.select(props.category || defaultCategory)
      .switchMap(res$ => res$
        .map(res => {
          //console.log(`from http`, res)
          if (res.statusCode === 200) {
            const respData = JSON.parse(res.text)
            return {
              type: `success`,
              data: respData.suggestions
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
      return x.data.map(result => ({
        name: clean(result.text),
        magicKey: result.magicKey,
        type: `default`
      }))
      .filter(x => x.name.split(',').length === 3)
      .map(x => {
        return {...x, normalizedName: normalizeArcGISSingleLineToString(x.name)}
       })
    })
    .publish().refCount()

  const waiting$ = O.merge(
    toHTTP$.mapTo(true),
    O.merge(results$, error$).mapTo(false)
  ).startWith(false).publishReplay(1).refCount()

  return {
    HTTP: toHTTP$,
    results$,
    error$,
    waiting$
  }
}

export default ArcGISSuggest