import {Observable as O} from 'rxjs'

const LOGIN_ENDPOINT = `/api_auth/login`
const LOGOUT_ENDPOINT = `/api_auth/logout`

function intent(sources) {
  const redirect$ = sources.HTTP.response$$
    .filter(res$ => res$.request.url === LOGOUT_ENDPOINT)
    .switchMap(x => x)
    .share()

  return {
    redirect$
  }
}

export default function process(sources, message$) {
  const actions = intent(sources )
  const logout$ = message$
    .filter(x => x.type === `logout`)
    .map(x => {
      return x
    })
    .share()

  const toHTTP$ = logout$
    .mapTo({
      url: LOGOUT_ENDPOINT,
      method: `post`,
      type: `json`,
      category: `logout`
    })

  const toMessage$ = O.merge(
    logout$.mapTo({
      type: `waiting`,
      data: true
    }),
    actions.redirect$.mapTo({
      type: `waiting`,
      data: false
    })
  )

  return {
    Global: actions.redirect$
      .map(data => ({
        type: `redirect`,
        data: `/`
      })),
    HTTP: toHTTP$,
    message$: toMessage$
  }
}
