import {Observable as O} from 'rxjs'

const SIGNUP_ENDPOINT = `/api_auth/signup`

function intent(sources) {
  const response$ = sources.HTTP.select(`signup`)
    //.filter(res$ => res$.request.url === SIGNUP_ENDPOINT)
    .switchMap(x => x)
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()

  const good$ = response$
    .map(x => {
      return x
    })
    .filter(x => x.status === 200)
    .map(x => x.body)
    .publish().refCount()

  const bad$ = response$
    .filter(x => x.status !== 200)

  const failed$ = good$
    .filter(x => x.type === `error`)
    .map(x => x.data)

  const success$ = good$
    .filter(x => x.type === `success`)

  bad$
    .subscribe(
      x => console.error(`Bad signup response: `, x),
      e => console.error(`signup bad$ errored`, e),
      c => console.log(`signup bad$ completed`, c)
    )


  return {
    success$,
    failed$,
    stopWaiting$: response$
  }
}

export default function process(sources, message$) {
  const actions = intent(sources)

  const signup$ = message$
    .filter(x => x.type === `signup`)
    .map(x => x.data)
    .publish().refCount()

  const attempt$ = signup$
    .filter(x => x.type === `attempt`)
    .map(x => x.data)
    .map(x => ({
        url: SIGNUP_ENDPOINT,
        method: `post`,
        type: `json`,
        send: x,
        category: `signup`
    }))
    .map(x => {
      return x
    })
    .publish().refCount()

  const toMessage$ = O.merge(
    actions.failed$
      .map(x => ({
        type: `signup`,
        data: {
          type: `error`,
          data: x
        }
      }))
      .map(x => {
        return x
      }),
      attempt$.mapTo({
        type: `waiting`,
        data: true
      }),
      actions.stopWaiting$.mapTo({
        type: `waiting`,
        data: false
      })
    ).map(x => {
      return x
    })

  return {
    HTTP: attempt$,
    Global: actions.success$
      .map(x => {
        return x
      })
      .mapTo({
        type: `redirect`,
        data: `/`
      }),
    message$: toMessage$
  }

}
