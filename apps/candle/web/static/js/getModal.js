import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM, spread} from './utils'

import Menu from './library/menu/main'
import LeftMenuContent from './library/menu/left/main'
import Modal from './library/modal/simple/main'
import DoneModal from './library/modal/done/main'
import Login from './library/authorization/login/main'
import Signup from './library/authorization/signup/main'
import Presignup from './library/authorization/presignup/main'
import SearchArea from './page/create/location/searchArea/main'

export default function getModal(sources, inputs, modal) {
    if (modal === `leftMenu`) {
      return Menu(sources, spread(
        inputs, {
        component: LeftMenuContent,
        props$: O.of({})
      }))
    } else if (modal === `login`) {
      return Modal(sources, spread(
        inputs, {
        component: Login,
        props$: O.of({
          headerText: `Log in`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else if (modal === `signup`) {
      return Modal(sources, spread(
        inputs, {
        component: Signup,
        props$: O.of({
          headerText: `Sign up`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else if (modal === `presignup`) {
      return Modal(sources, spread(
        inputs, {
        component: Presignup,
        props$: O.of({
          headerText: `Confirm user info`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else if (modal === `vicinity`) {
      const doneModal = DoneModal(sources, {
          component: (sources, inputs) => SearchArea(sources, {
            geolocation$: O.of({
              prefer: "user",
                user: {position: {
                  lat: 40.7128, 
                  lng: -74.0059
                },
                region: {
                  source: `arcgis`,
                  type: `somewhere`,
                  data: {
                    country: `US`,
                    city: `New York`,
                    state: `New York`,
                    stateAbbr: `NY`
                  }
                }
              }
            }),
            listing$: O.of({
              profile: {
                location: {
                  position: {
                    lat: 40.7128, 
                    lng: -74.0059
                  }
                }
              }
            })
          }),
          props$: O.of({
            headerText: `Change Vicinity`,
            type: `standard`,
            alwaysShowHeader: false
          })
        })

        const DOM = doneModal.DOM.publishReplay(1).refCount()
        const HTTP= doneModal.HTTP.publishReplay(1).refCount()
        const MapDOM= doneModal.MapDOM
          .do(x => console.log(`MapDOM`, x))
          .publishReplay(1).refCount()
        const Global= O.never().publish().refCount()

        DOM.subscribe()
        HTTP.subscribe()
        MapDOM.subscribe()
        Global.subscribe()

        return {
          DOM,
          HTTP,
          MapDOM,  
          Global
        }


      // const out = DoneModal(sources, spread(
      //   inputs, {
      //   component: (sources, inputs) => Vicinity(sources, spread(inputs, {
      //     listing$: O.of({
      //       profile: {
      //         location: {
      //           position: {lat: 40, lng: -70},
      //         }
      //       }
      //     })
      //   })),
      //   props$: O.of({
      //     headerText: `Change Vicinity`,
      //     type: `standard`,
      //     alwaysShowHeader: false
      //   })
      // }))

      // out.HTTP.subscribe()
      // return out
    } else {
      const out = blankComponentUndefinedDOM(sources, inputs)
      return out
    }
}