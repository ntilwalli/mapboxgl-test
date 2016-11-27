import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj, getPreferredRegion$} from '../../../../utils'
import clone = require('clone')

// function venueToDonde(venue) {
//   return {
//     type: `venue`,
//     ...venue
//   }
// }

function reducers(actions, inputs) {
  const show_modal_r = actions.show_search_area_screen$
    .map(show => state => {
      return state.set(`modal`, `search_area`)
    })

  const hide_modal_r = inputs.hide_modal$
    .map(show => state => {
      return state.set(`modal`, undefined)
    })

  const donde_r = inputs.donde$.map(donde => state => {
    console.log(`donde r:`, donde)
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
        x.search_area = search_area
        return x
      })
      .set(`modal`, undefined)
  })

  return O.merge(hide_modal_r, show_modal_r, donde_r, search_area_r)
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
      const cloned_session = clone(session)

      const init = {
        session: clone(session),
        authorization,
        modal: undefined,
        valid: false,
        mode: `venue`
      }

      if (!init.session.search_area) {
        init.session[`search_area`] = {
          region,
          radius: 30000
        }
      }

      if (!init.session.current_step) {
        init.session[`current_step`] = `donde`
      }

      if (!init.session.listing) {
        init.session.listing = {
        }
      }

      if (!init.session.listing) {
        init.session.listing.donde = undefined
      }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}
