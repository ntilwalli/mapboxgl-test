import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, getPreferredRegion$, traceStartStop, processHTTP, onlyError, onlySuccess} from '../utils'
import Immutable = require('immutable')

import RegionSelector from '../library/bootstrapRegionSelector'

function intent(sources) {
  const {MessageBus} = sources

  const update$ = MessageBus.address(`/services/searchFilters`)
      .publish().refCount()

  const storage_filters$ = sources.Storage.local.getItem(`searchFilters`)
    .map(x => {
      const out =  x ? JSON.parse(x) : x
      return out
    })
    .take(1)
    .publishReplay(1).refCount()

  return {
    update$,
    storage_filters$
  }
}

function reducers(actions, inputs) {
  const update_r = actions.update$.map(new_settings => state => {
    //console.log(`new settings`, new_settings)
    return Immutable.fromJS(new_settings)
  })

  return O.merge(update_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const preferred_region$ = getPreferredRegion$(inputs).take(1)
  return combineObj({
    storage_filters$: actions.storage_filters$.take(1),
    preferred_region$
  })
    .switchMap((info: any) => {
      const init = info.storage_filters || {
        search_region: info.preferred_region,
        categories: ['/comedy'],
        event_types: ['open_mic'],
        cost: ['free', 'paid']
      }

      return reducer$
        .startWith(Immutable.fromJS(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.letBind(traceStartStop(`settings state trace`))
    //.do(x => console.log(`services/settings state`, x))
    .publishReplay(1).refCount()
}

function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const toStorage$ = state$
    .map(x => {
      return {
        action: `setItem`,
        key: `searchFilters`,
        value: JSON.stringify(x)
      }
    })
    .skip(1)
    //.do(x => console.log(`set stored application settings`, x))

  return {
    Storage: toStorage$,
    output$: state$
      .distinctUntilChanged()
      //.do(x => console.log(`services/settings output`, x))
      .publishReplay(1).refCount()
  }
}

export default main
