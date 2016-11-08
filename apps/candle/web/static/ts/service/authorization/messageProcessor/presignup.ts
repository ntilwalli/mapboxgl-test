import {Observable as O} from 'rxjs'

const PRESIGNUP_ENDPOINT = `/api_auth/presignup`

function intent(sources) {
  const response$ = sources.HTTP.select(`presignup`)
    //.filter(res$ => res$.request.url === PRESIGNUP_ENDPOINT)
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
    .publish().refCount()

  const success$ = good$
    .filter(x => x.type === `success`)
    .publish().refCount()

  const redirect$ = good$
    .filter(x => x.type === `redirect`)
    .publish().refCount()

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

export default function process(sources) {
  const actions = intent(sources)

  const signup$ = sources.MessageBus.address(`/authorization/presignup`)

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
        category: `presignup`
    }))
    .map(x => {
      return x
    })
    .publish().refCount()

  const toMessageBus$ = O.merge(
    actions.failed$
      .map(x => ({
        to: `/modal/presignup`,
        message: {
          type: `error`,
          data: x
        }
      }))//,
    // attempt$.mapTo({
    //     type: `waiting`,
    //     data: true
    //   }),
    // actions.stopWaiting$.mapTo({
    //     type: `waiting`,
    //     data: false
    //   })
  )

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
    MessageBus: toMessageBus$
  }

}
