import {Observable as O} from 'rxjs'
import moment from 'moment'
import {noopListener, combineObj} from '../utils'
import Immutable from 'immutable'

const suggestUrlPrefix = `http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest`
const defaultCategory = "ArgGISSuggest"

function toSuggestionsHTTP({props, input, center}) {
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


function isValidSuggestionsRequest (url) {
  const hasParam = url.indexOf("?text=")
  if (hasParam) {
    const afterText = url.substring(hasParam + 6)
    const firstAmp = afterText.indexOf("&")
    if (firstAmp > 0) {
      return true
    } else {
      return false
    }
  }

  return false
}

function getResults ({HTTP}, {props$, input$, center$}) {
  const filteredInput$ = input$.filter(x => x.length)
    .map(x => {
      return x
    })
    .filter(input => input.length > 0)

  const withLatestInput$ = combineObj({
    props$,
    input$: filteredInput$,
    center$
  })
  .distinctUntilChanged((x, y) => x.input === y.input)

  const output$ = withLatestInput$
    .map(({props, input, center}) => {
      //console.log(`address suggester partial: ${input}`)
      let suggestionsRequest = toSuggestionsHTTP({props: props || {}, input, center})
      let suggestionsRequest$ = O.of(suggestionsRequest)
      let suggestionsUrl = suggestionsRequest.url
      let isValid = isValidSuggestionsRequest(suggestionsUrl)

      if (!isValid) {
        return {
          HTTP: most.empty(),
          results$: most.of([]),
          error$: most.of([])
        }
      }

      //console.log(`suggestions url ${suggestionsUrl}`)
      const suggestionsResponse$ = HTTP.select(props.category || defaultCategory)
        // .filter(res$ => {
        //   const url = res$.request.url
        //   const isEqual = url === suggestionsUrl
        //   return isEqual
        // })
        .switchMap(res$ => res$
          .map(res => {
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
        .share()


      const suggestionsError$ = suggestionsResponse$.filter(x => x.type === `error`).map(x => [x.data])
      const suggestionsSuccess$ = suggestionsResponse$
        .filter(x => x.type === `success`)
        .map(x => {
          return x.data.map(result => ({
            name: result.text,
            magicKey: result.magicKey
          }))
        })

      return {
        HTTP: suggestionsRequest$.take(1),
        results$: suggestionsSuccess$.take(1),
        error$: suggestionsError$.take(1)
      }
    })

    return output$
}

function ArcGISSuggest (sources, inputs) {

  const streams$ = getResults(sources, inputs).share()

  return {
    HTTP: streams$.switchMap(x => x.HTTP)
      .map(x => {
        return x
      }),
    results$: streams$.switchMap(x => x.results$)
      .map(results => results.map(x => {
        x.type = `default`
        return x
      })),
    error$: streams$.switchMap(x => x.error$)
  }
}

export default ArcGISSuggest
