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
    redirect$: success$,
    failedLogin$,
    error$: response_bad$

  }
}

export default function process(sources) {
  const actions = intent(sources)

  const message$ = sources.MessageBus.address(`/authorization/login`)
    //.do(x => console.log(`login message:`, x))
    .publishReplay(1).refCount()

  const local$ = message$
    .filter(x => x.type === 'local')
    .map(x => x.data)
    .map(x => ({
        url: LOGIN_ENDPOINT,
        method: `post`,
        type: `json`,
        send: {
          username: x.username,
          password: x.password,
          redirect_url: x.data.redirect_url
        },
        category: `login`
    }))
    .map(x => {
      return x
    })
    .publish().refCount()

  const facebook$ = message$
    .filter(x => x.type === `facebook`)
    .map((x: any) => {
      console.log('got facebook request', JSON.stringify(x))
      const redirect = x.data && x.data.redirect_url || ''
      return `/auth/facebook?redirect_url=${redirect}`
    })
  const twitter$ = message$
    .filter(x => x.type === `twitter`)
    .map((x: any) => {
      const redirect = x.data && x.data.redirect_url || ''
      return `/auth/twitter?redirect_url=${redirect}`
    })
  const github$ = message$
    .filter(x => x.type === `github`)
    .map((x: any) => {
      const redirect = x.data && x.data.redirect_url || ''
      return `/auth/github?redirect_url=${redirect}`
    })

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
    Global: O.merge(
      facebook$, 
      twitter$, 
      github$, 
      actions.redirect$.withLatestFrom(message$.map((x: any) => x.data), (_, message) => {
        return message && message.data.redirect_url || '/'
      })
    ).map(x => ({type: 'redirect', data: x})),
    MessageBus: toMessageBus$
  }

}
