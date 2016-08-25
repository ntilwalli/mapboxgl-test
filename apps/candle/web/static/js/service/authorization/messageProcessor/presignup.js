import {Observable as O} from 'rxjs'

const PRESIGNUP_ENDPOINT = `/api_auth/presignup`

function intent(sources) {
  const response$ = sources.HTTP.response$$
    .filter(res$ => res$.request.url === PRESIGNUP_ENDPOINT)
    .switchMap(x => x)
    .map(x => {
      return x
    })
    .cache(1)

  const good$ = response$
    .map(x => {
      return x
    })
    .filter(x => x.status === 200)
    .map(x => x.body)
    .share()

  const bad$ = response$
    .filter(x => x.status !== 200)

  const failed$ = good$
    .filter(x => x.type === `error`)
    .map(x => x.data)
    .share()

  const success$ = good$
    .filter(x => x.type === `success`)
    .share()

  const redirect$ = good$
    .filter(x => x.type === `redirect`)
    .share()

  bad$
    .subscribe(
      x => console.error(`Bad signup response: `, x),
      e => console.error(`signup bad$ errored`, e),
      c => console.log(`signup bad$ completed`, c)
    )

  const stopWaiting$ = response$


  return {
    redirect$,
    success$,
    failed$,
    stopWaiting$
  }
}

export default function process(sources, message$) {
  const actions = intent(sources)

  const signup$ = message$
    .filter(x => x.type === `presignup`)
    .map(x => x.data)
    .share()

  const attempt$ = signup$
    .filter(x => x.type === `attempt`)
    .map(x => {
      return x.data
    })
    .map(x => ({
        url: PRESIGNUP_ENDPOINT,
        method: `post`,
        type: `json`,
        send: x,
        category: `signup`
    }))
    .map(x => {
      return x
    })
    .share()

  const toMessage$ = O.merge(
    actions.failed$
      .map(x => ({
        type: `presignup`,
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
    Global: O.merge(
      actions.success$
        .map(x => {
          return x
        })
        .mapTo({
          type: `redirect`,
          data: `/`
        }),
      actions.redirect$
    ),
    message$: toMessage$
  }

}
