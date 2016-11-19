import {Observable as O} from 'rxjs'
import moment = require('moment')
import {combineObj, clean, traceStartStop} from '../utils'
import Immutable = require('immutable')

const suggestUrlPrefix = `http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest`
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

  return {
    HTTP: O.never(),
    results$: input$.mapTo([]),
    error$: O.never()
  }
}

export default ArcGISSuggest