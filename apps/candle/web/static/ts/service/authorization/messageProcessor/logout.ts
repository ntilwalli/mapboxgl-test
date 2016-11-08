import {Observable as O} from 'rxjs'

const LOGIN_ENDPOINT = `/api_auth/login`
const LOGOUT_ENDPOINT = `/api_auth/logout`

function intent(sources) {
  const redirect$ = sources.HTTP.select(`logout`)
    //.filter(res$ => res$.request.url === LOGOUT_ENDPOINT)
    .switchMap(x => x)
    .publish().refCount()

  return {
    redirect$
  }
}

export default function process(sources) {
  const actions = intent(sources )
  const logout$ = sources.MessageBus.address(`/authorization/logout`)

  const toHTTP$ = logout$
    .mapTo({
      url: LOGOUT_ENDPOINT,
      method: `post`,
      type: `json`,
      category: `logout`
    })

  const toMessageBus$ = O.never()
  // O.merge(
  //   logout$.mapTo({
  //     type: `waiting`,
  //     data: true
  //   }),
  //   actions.redirect$.mapTo({
  //     type: `waiting`,
  //     data: false
  //   })
  // )

  return {
    Global: actions.redirect$
      .map(data => ({
        type: `redirect`,
        data: `/`
      })),
    HTTP: toHTTP$,
    MessageBus: toMessageBus$
  }
}
