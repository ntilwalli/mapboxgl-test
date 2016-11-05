import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {spread, combineObj, mergeSinks, processHTTP} from '../../utils'
import Immutable = require('immutable')
import deepEqual = require('deep-equal')
import moment = require('moment')

function intent(sources) {
  const {good$, bad$, ugly$} = processHTTP(sources, `searchRequest`)

  return {
    good$,
    bad$,
    ugly$
  }
}

function reducers(actions, inputs) {
  const {geolocation$} = inputs
  const geolocationR = geolocation$
    .distinctUntilChanged(null, x => x)
    .skip(1)
    .map(x => state => {
      return state.set(`geolocation`, x)
    })

  const resultsR = actions.good$
    .map(results => state => {
      console.log(`results:`, results)
      return state.set(`results`, results)
    })

  return O.merge(geolocationR, resultsR)
}
function model(actions, inputs) {
  const {geolocation$} = inputs
  const reducer$ = reducers(actions, inputs)

  return combineObj({
    geolocation$: geolocation$.take(1)
  }).switchMap(initialState => {
    return reducer$
      .startWith(Immutable.Map(spread(initialState, {results: []})))
      .scan((acc, f: Function) => f(acc))
  })
  .map(x => x.toJS())
  .publishReplay(1).refCount()

}

function getPreferredPosition(geolocation) {
  const {prefer} = geolocation
  return geolocation[prefer].position
}

function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const out = {
    DOM: state$.map(state => {
      const {geolocation} = state
      return div([JSON.stringify(getPreferredPosition(geolocation))])
    }),
    HTTP: inputs.geolocation$
      .map(getPreferredPosition)
      .distinctUntilChanged(deepEqual, x => x)
      .map(position => ({
        url: "/api/user",
        method: "post",
        type: "json",
        send: {
          route: "/search",
          data: {
            begins: moment(),
            ends: moment().add("day", 2),
            center: position,
            radius: 10000
          }
        },
        category: `searchRequest`
    
    }))
    .do(x => console.log(`query: `, x))
  }

  return out
}

export default main