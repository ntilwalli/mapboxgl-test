import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM, spread} from './utils'

import Menu from './library/menu/main'
import LeftMenuContent from './library/menu/left/main'
import Modal from './library/modal/simple/main'
//import DoneModal from './library/modal/done/main'
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
    } else {
      return blankComponentUndefinedDOM()
    }
}