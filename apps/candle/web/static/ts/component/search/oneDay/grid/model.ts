import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'
import {getDefaultFilters} from '../helpers'

const log = console.log.bind(console)

function reducers(actions, inputs) {
  return O.never()
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .map((info: any) => {
      const {results, filters} = info
      const isValid = Array.isArray(results) && results
      return Immutable.Map({
        results: isValid ? results : [],
        filters: filters || getDefaultFilters()
      })
    })
    .switchMap(init => {
      //console.log(`Resetting grid state...`)
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`grid state:`, x))
    .publishReplay(1).refCount()
}

