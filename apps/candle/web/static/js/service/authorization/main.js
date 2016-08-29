import {Observable as O} from 'rxjs'
import Login from './messageProcessor/login'
import Logout from './messageProcessor/logout'
import Signup from './messageProcessor/signup'
import Presignup from './messageProcessor/presignup'

const COOKIE_INDICATOR = `cookie`
const AUTHORIZATION_INDICATOR = `authorization`

export default function Authorization(sources, inputs) {
  const authMessage$ = inputs.message$
    .map(x => {
      return x
    })
    .filter(x => x.type === AUTHORIZATION_INDICATOR)
    .map(x => x.data)
    .share()

  const login = Login(sources, authMessage$)
  const logout = Logout(sources, authMessage$)
  const signup = Signup(sources, authMessage$)
  const presignup = Presignup(sources, authMessage$)

  const status$ = sources.Global
    .map(x => {
      return x
    })
    .filter(x => x.type === COOKIE_INDICATOR && x.data)
    .map(x => x.data)
    .map(x => {
      console.log(`cookie authorization: `, x && x.authorization)
      const out = x && x.authorization
      return out
    })
    .map(x => {
      if (x) {
        const re = /^Bearer ([a-zA-Z0-9_-]*).([a-zA-Z0-9_-]*).([a-zA-Z0-9_-]*)$/
        const m = re.exec(x)
        if (m) {
          const [_, eHeader, ePayload, eSignature] = m
          const dPayload = window.atob(ePayload)
          const {exp, sub} = JSON.parse(dPayload)
          const user = JSON.parse(sub)

          console.log("Authenticated user:", user)
          return m
        } else {
          return undefined
        }
      } else {
        return undefined
      }
    })
    .cache(1)

  return {
    status$: status$,
    Global: O.merge(login.Global, logout.Global, signup.Global, presignup.Global),
    HTTP: O.merge(login.HTTP, logout.HTTP, signup.HTTP, presignup.HTTP),
    message$: O.merge(signup.message$, login.message$, presignup.message$)
      .map(x => ({
        type: AUTHORIZATION_INDICATOR,
        data: x
      }))
      .map(x => {
        return x
      })
  }
}
