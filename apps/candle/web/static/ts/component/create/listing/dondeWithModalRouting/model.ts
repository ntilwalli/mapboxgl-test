import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, getPreferredRegion$} from '../../../../utils'
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

  return O.merge(donde_r)
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
  const region$ = getPreferredRegion$(inputs)
  return combineObj({
      region$: region$.take(1),
      session$: actions.session$.take(1),
      authorization$: inputs.Authorization.status$.take(1)
    })
    .switchMap((info: any) => {
      const {region, session, authorization} = info

      const init = {
        session,
        authorization,
        modal: undefined,
        valid: !!(session.listing.donde),
        mode: `venue`
      }

      // if (!init.session.properties) {
      //   init.session[`properties`] = {}
      // }

      // if (!init.session.properties.search_area) {
      //   init.session[`properties`][`search_area`] = {
      //     region,
      //     radius: 30000
      //   }
      // }

      // if (!init.session.current_step) {
      //   init.session[`current_step`] = `donde`
      // }

      // if (!init.session.listing) {
      //   init.session.listing = {
      //   }
      // }

      // if (!init.session.listing) {
      //   init.session.listing.donde = undefined
      // }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    // .map(x => ({
    //   ...x,
    //   valid: true
    // }))
    .publishReplay(1).refCount()
}
