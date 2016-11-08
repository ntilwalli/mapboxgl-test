import {Observable as O} from 'rxjs'

const LOGIN_ENDPOINT = `/api_auth/login`

function intent(sources) {
  const response$ = sources.HTTP.select(`login`)
    //.filter(res$ => res$.request.url === LOGIN_ENDPOINT)
    .switchMap(x => x)
    // .map(x => {
    //   return x
    // })
    .publish().refCount()

  const response_good$ = response$
    .filter(x => x.status === 200)
    .map(x => x.body)
    .publish().refCount()

  const response_bad$ = response$
    .filter(x => x.status !== 200)
    .publish().refCount()

  const failedLogin$ = response_good$
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .publish().refCount()

  const success$ = response_good$
    .filter(x => x.type === `success`)
    .publish().refCount()


  return {
    redirect$: success$.mapTo(`/`),
    failedLogin$,
    error$: response_bad$

  }
}

export default function process(sources) {
  const actions = intent(sources)

  const data$ = sources.MessageBus.address(`/authorization/login`)
    .do(x => console.log(`login message:`, x))
    .publishReplay(1).refCount()

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
    .publish().refCount()

  const facebook$ = data$
    .filter(x => x.type === `facebook`)
    .map(() => `/auth/facebook`)
  const twitter$ = data$
    .filter(x => x.type === `twitter`)
    .map(() => `/auth/twitter`)
  const github$ = data$
    .filter(x => x.type === `github`)
    .map(() => `/auth/github`)

  const toMessageBus$ = O.merge(
    actions.failedLogin$
      .map(x => ({
          type: `error`,
          data: x
      })),
    local$.mapTo({
      type: `waiting`,
      data: true
    }),
    O.merge(actions.redirect$, actions.failedLogin$).mapTo({
      type: `waiting`,
      data: false
    })
  )
  .map(x => ({to: `/modal/login`, message: x}))
  .publishReplay(1).refCount()

  //local$.subscribe()
  return {
    HTTP: local$.do(x => console.log(`login HTTP`, x)),
    Global: O.merge(facebook$, twitter$, github$, actions.redirect$)
      .map(data => ({
        type: `redirect`,
        data
      })),
    MessageBus: toMessageBus$
  }

}
