import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, traceStartStop, processHTTP, onlyError, onlySuccess} from '../utils'
import Immutable = require('immutable')

function intent(sources) {
  const {HTTP, MessageBus} = sources

  const {good$, bad$, ugly$} = processHTTP(sources, 'getApplicationSettings')
  const success$ = good$.filter(onlySuccess).pluck(`data`)
    //.do(x => console.log(`settings http/source`, x))
    .publishReplay(1).refCount()
  const error$ = O.merge(good$.filter(onlyError), bad$, ugly$)
    .publishReplay(1).refCount()
  const storage_settings$ = sources.Storage.local.getItem(`applicationSettings`)
    .take(1)
    .publishReplay(1).refCount()

  return {
    success$,
    error$,
    storage_settings$,
    update$: MessageBus.address(`/settings`)
  }
}

function reducers(actions, inputs) {
  const update_r = actions.update$.map(new_settings => state => {
    console.log(`new settings`, new_settings)
    return new_settings
  })

  return O.merge(update_r)
}

function model(actions, inputs) {
  const {authorized$, not_authorized$} = inputs
  const reducer$ = reducers(actions, inputs)
  const retrieved_settings$ = O.merge(
    authorized$.switchMap(_ => actions.success$),
    not_authorized$
      .switchMap(_ => {
        return actions.storage_settings$
          .map(x => {
            if (x) return JSON.parse(x)
            else return null
          })
      })
      //.do(x => console.log(`get application settings`, x))
      .take(1)
  )

  return combineObj({
    default_settings$: inputs.props$.take(1),
    retrieved_settings$: retrieved_settings$
  }).switchMap((info: any) => {
      const {default_settings, retrieved_settings} = info
      let init = retrieved_settings || default_settings

      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    //.letBind(traceStartStop(`settings state trace`))
    //.do(x => console.log(`services/settings state`, x))
    .publishReplay(1).refCount()
}

function main(sources, inputs) {
  const actions = intent(sources)

  const authorized$ = inputs.authorization$.filter(x => !!x)
    //.do(x => console.log(`authorized`, x))
    .publishReplay(1).refCount()
  const not_authorized$ = inputs.authorization$.filter(x => !x)
    //.do(x => console.log(`not authorized`, x))
    .publishReplay(1).refCount()

  const defaultSettings = {
      use_region: `user`,
      default_region: {
        position: {
          lng: -74.0059,
          lat: 40.7128
        },
        city_state: {
          city: `New York`,
          state_abbr: `NY`
        }
      }
    }
  const props$ = O.of(defaultSettings)

  const state$ = model(actions, {
    ...inputs, 
    props$, 
    authorized$, 
    not_authorized$
  })

  const toHTTP$ = authorized$.map(x => {
      return {
        url: `/api/user`,
        method: `post`,
        send: {
          route: `/settings`
        },
        category: `getApplicationSettings`
      }
    })
    .publishReplay(1).refCount()

  const toStorage$ = inputs.authorization$
    .filter(x => !x)
    .switchMap(_ => state$)
    .map(x => ({
      action: `setItem`,
      key: `applicationSettings`,
      value: JSON.stringify(x)
    }))
    .skip(1)
    .do(x => console.log(`set application settings`, x))

  return {
    HTTP: toHTTP$,
    Storage: toStorage$,
    output$: state$
      .distinctUntilChanged()
      //.do(x => console.log(`services/settings output`, x))
      .publishReplay(1).refCount(),
    waiting$: O.never()
    // O.merge(toHTTP$.mapTo(true), actions.success$.mapTo(false))
    //   .startWith(false)
    //   .publishReplay(1).refCount()
  }
}

export default main
