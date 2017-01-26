import {Observable as O} from 'rxjs'
import {normalizeComponent, spread} from './utils'
import LeftMenuModal from './library/leftMenuModal'
import GlobalModal from './library/globalModal'
import Login from './library/authorization/login/main'
import Signup from './library/authorization/signup/main'
import Presignup from './library/authorization/presignup/main'
import Forgotten from './library/authorization/forgotten/main'

function getModal(modal, sources, inputs): any {
  if (modal) {
    switch (modal.type) {
      case "leftMenu":
        return LeftMenuModal(sources, {...inputs, props$: O.of(modal.data)})
      case "login":
        return GlobalModal(sources, {
          ...inputs,
          props$: O.of({title: `Login`, styleClass: `.login-height`}),
          initialState$: O.of(modal.data),
          content: Login
        })
      case "signup":
        return GlobalModal(sources, {
          ...inputs,
          props$: O.of({title: `Sign-up`, styleClass: `.sign-up-height`}),
          initialState$: O.of(modal.data),
          content: Signup
        })
      case "presignup":
        return GlobalModal(sources, {
          ...inputs, 
          props$: O.of({title: `Almost done...`, styleClass: `.presignup-height`}),
          initialState$: O.of(modal.data),
          content: Presignup
        })
      case "forgotten":
        return GlobalModal(sources, {
          ...inputs, 
          props$: O.of({title: `Forgotten password`, styleClass: `.login-height`}),
          initialState$: O.of(modal.data),
          content: Forgotten
        })
      default:
        //console.log(type)
        return {
          DOM: O.of(null)
        }
    }
  } else {
    return {
      DOM: O.of(null)
    }
  }
}

export default getModal
