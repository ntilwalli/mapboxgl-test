import {Observable as O} from 'rxjs'

const LOGIN_ENDPOINT = `/api_auth/login`

function intent(sources) {
  const response$ = sources.HTTP.select(`login`)
    //.filter(res$ => res$.request.url === LOGIN_ENDPOINT)
    .switchMap(x => x)
    // .map(x => {
    //   return x
    // })
    .share()

  const response_good$ = response$
    .filter(x => x.status === 200)
    .map(x => x.body)
    .share()

  const response_bad$ = response$
    .filter(x => x.status !== 200)
    .share()

  const failedLogin$ = response_good$
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .share()

  const success$ = response_good$
    .filter(x => x.type === `success`)
    .share()


  return {
    redirect$: success$.mapTo(`/`),
    failedLogin$,
    error$: response_bad$

  }
}

export default function process(sources, message$) {
  const actions = intent(sources)

  const data$ = message$
    .filter(x => x.type === `login`)
    .map(x => x.data)
    .share()

  const local$ = data$
    .filter(x => x.type === 'local')
    .map(x => x.data)
    .map(x => ({
        url: LOGIN_ENDPOINT,
        method: `post`,
        type: `json`,
        send: x,
        category: `login`
    }))
    .map(x => {
      return x
    })
    .share()

  const facebook$ = data$
    .filter(x => x.type === `facebook`)
    .map(() => `http://127.0.0.1:4000/auth/facebook`)
  const twitter$ = data$
    .filter(x => x.type === `twitter`)
    .map(() => `http://127.0.0.1:4000/auth/twitter`)
  const github$ = data$
    .filter(x => x.type === `github`)
    .map(() => `http://127.0.0.1:4000/auth/github`)

  const toMessage$ = O.merge(
    actions.failedLogin$
      .map(x => ({
        type: `login`,
        data: {
          type: `error`,
          data: x
        }
      })),
    local$.mapTo({
      type: `waiting`,
      data: true
    }),
    O.merge(actions.redirect$, actions.failedLogin$).mapTo({
      type: `waiting`,
      data: false
    })
  ).map(x => {
      return x
    })

  return {
    HTTP: local$,
    Global: O.merge(facebook$, twitter$, github$, actions.redirect$)
      .map(data => ({
        type: `redirect`,
        data
      })),
    message$: toMessage$
  }

}
