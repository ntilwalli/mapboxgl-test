import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'
import clone = require('clone')

function reducers(actions, inputs) {
  const donde_r = inputs.donde$.map(donde => state => {
    const mode = state.get(`mode`)
    return state.update(`session`, session => {
      if (mode === `venue`) {
        session.listing.donde = donde
      }

      return session
    }).set(`valid`, !!donde)

  })

  const search_area_r = inputs.search_area$.map(search_area => state => {
    return state.update(`session`, x => {
        x.properties.search_area = search_area
        return x
      })
      .set(`modal`, undefined)
  })

  return O.merge(donde_r, search_area_r)
}

function getBlankVenue() {
  return {
    type: `venue`,
    source: undefined,
    data: undefined,
    lng_lat: undefined
  }
}

export function model(actions, inputs) {
  const init = {}
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1),
      authorization$: inputs.Authorization.status$.take(1)
    })
    .switchMap((info: any) => {
      const {region, session, authorization} = info

      const init = {
        session,
        authorization,
        valid: !!(session.listing.donde),
        mode: `venue`
      }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}
