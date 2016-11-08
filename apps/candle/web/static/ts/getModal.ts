import {Observable as O} from 'rxjs'
import {normalizeComponent, spread} from './utils'
import LeftMenuModal from './library/leftMenuModal'
import GlobalModal from './library/globalModal'
import Login from './library/authorization/login/main'
import Signup from './library/authorization/signup/main'
import Presignup from './library/authorization/presignup/main'

function getModal(type, sources, inputs): any {
  switch (type) {
    case "leftMenu":
      return LeftMenuModal(sources, inputs)
    case "login":
      return GlobalModal(sources, spread(inputs, {
        props$: O.of({title: `Login`, styleClass: `.login-height`}),
        content: Login
      }))
    case "signup":
      return GlobalModal(sources, spread(inputs, {
        props$: O.of({title: `Sign-up`, styleClass: `.sign-up-height`}),
        content: Signup
      }))
    case "presignup":
      return GlobalModal(sources, spread(inputs, {
        props$: O.of({title: `Almost done...`, styleClass: `.presignup-height`}),
        content: Presignup
      }))
    default:
      //console.log(type)
      return {
        DOM: O.of(null)
      }
  }
}

export default getModal
