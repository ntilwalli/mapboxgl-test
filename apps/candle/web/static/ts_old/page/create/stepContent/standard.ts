import {Observable as O} from 'rxjs'
import {div, button, span} from '@cycle/dom'
import Immutable = require('immutable')
import isolate from '@cycle/isolate'
import {traceStartStop, combineObj, createProxy, spread, normalizeComponent, normalizeSink, mergeSinks, defaultNever, processHTTP} from '../../../utils'


function intent(sources) {
  const {DOM, HTTP, Environment} = sources
  const next$ = DOM.select(`.appNextButton`).events(`click`)
  const back$ = DOM.select(`.appBackButton`).events(`click`)
  const {good$, bad$, ugly$} = processHTTP(sources, `saveListingSessionOnNext`)
  
  const created$ = good$.filter(x => x.type === `created`)
    .map(x => {
      return x
    })
    .publish().refCount()
  const saved$ = good$
    .map(x => {
      return x
    })
    .filter(x => x.type === `saved`)
    .map(x => {
      return x
    })
    .publish().refCount()
  const fromHTTP$ = O.merge(
    created$,
    saved$,
    bad$,
    ugly$,
  )

  const updatedSession$ = O.merge(created$, saved$).map(x => (<any> x).data)

  return {
    next$, back$, fromHTTP$, created$, updatedSession$, environment$: Environment
  }
}

function reducers(actions, inputs) {
  const savedSessionR = defaultNever(inputs, `listing$`).map(x => state => {
    const cs = state.get(`contentState`)
    cs.listing = x
    return state.set(`contentState`, cs).set(`autosave`, false)
  })
  const validR = inputs.contentState$
    .map(val => state => {
      return state.set(`contentState`, val).set(`autosave`, true)
    })

  return O.merge(validR, savedSessionR)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return actions.environment$
    .map((environment: any) => {
      return {
        environment,
        waiting: false,
        contentState: undefined,
        autosave: false
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f: Function) => f(acc))
    })
    .skip(1)
    .map(x => (<any> x).toJS())
    //.do(x => console.log(`stepComponent state`, x))
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj(components).debounceTime(4)
    .withLatestFrom (state$, (components, state: any) => {
      const {contentState, waiting} = state
      const {valid} = contentState
      const {content} = components

      if (waiting) {
        return div(`.panel.modal`, [`Waiting`])
      } else {
        const disabled = !valid ? '.disabled' : ''
        return div(`.input-section`, [
          div(`.form-section`, [
            div(`.empty-section`),
            div(`.content-section`, [
              content
            ])
          ])
          , div(`.controller-section`, [
            div(`.separator`),
            div(`.button-section`, [
              button(`.appBackButton.back-button`, [
                div(`.full.flex-center`, [ // Due to Safari 9.1.1 justify content bug...
                  span(`.fa.fa-angle-left`),
                  span(`.back-text.icon`, [`Back`])
                ])
              ]),
              button('.appNextButton.next-button' + disabled, [
                div(`.full.flex-center`, [
                  span('.next-text' + disabled, ['Next']),
                  span('.fa.fa-angle-right' + disabled)
                ])
              ])
            ])
          ])
        ])
      }
    })
}

export default function main(sources, inputs) {
  const {props$} = inputs
  const component$ = props$.map(props => {
    const {contentComponent, create, nextRequiresSessionId, previous, next} = props
    const content = contentComponent(sources, inputs)
    const components = {
      content$: content.DOM
    }

    const actions = intent(sources)
    const state$ = model(actions, spread(inputs, {
      contentState$: content.state$
    }))

    const vtree$ = view(state$, components)
    
    const decision$ = actions.next$
      .withLatestFrom(state$, (_, state) => {
        const {contentState} = state
        const {session} = contentState
        const {listing} = session

        let nextScreen = next
        if (typeof next === 'function') {
          nextScreen = next(listing)
        }

        if (session.id) {
          return {
            type: "Router",
            data: {
              pathname: `/create/${session.id}/${nextScreen}`,
              action: `PUSH`,
              state: session
            }
          }
        } else if (!nextRequiresSessionId) {
          const out = {
            type: "Router",
            data: {
              pathname: `/create/${nextScreen}`,
              action: `PUSH`,
              state: session
            }
          }

          return out
        } else {
          return {
            type: "HTTP",
            data: session
          }
        }
      }).publish().refCount()
    
    const requestedSaveSession$ = decision$
      .filter(x => x.type === `HTTP`)
      .map(x => x.data)
      .publish().refCount()

    const toHTTP$ = requestedSaveSession$
      .map(session => {
        return {
          url: `/api/user`,
          method: `post`,
          type: `json`,
          send: {
            route: `/listing_session/save`,
            data: session
          },
          category: `saveListingSessionOnNext`
        }
      })
      .publish().refCount()

    const toNextScreen$ = O.merge(
      decision$.filter(x => x.type === "Router").map(x => x.data),
      actions.created$.map(x => x.data).map(session => {
        let nextScreen = next
        if (typeof next === 'function') {
          nextScreen = next(session)
        }
        return {
          pathname: `/create/${session.id}/${nextScreen}`,
          action: `PUSH`,
          state: session
        }
      })
    )
    

    const toPreviousScreen$ = actions.back$
      .withLatestFrom(state$, (_, state) => {
        const {contentState} = state
        const {session} = contentState
        const {listing} = session

        let previousScreen = previous
        if (typeof previous === 'function') {
          previousScreen = previous(session)
        }

        if (listing.id) {
          const pathname = previous ? `/create/${session.id}/${previousScreen}` : `/create/${listing.id}`
          return {
            pathname,
            action: `PUSH`,
            state: session
          }
        } else {
          const pathname = previous ? `/create/${previousScreen}` : `/create`
          return {
            pathname,
            action: `PUSH`,
            state: session
          }
        }
      })

 
    return {
      DOM: vtree$,
      HTTP: O.merge(
        defaultNever(content, `HTTP`),
        toHTTP$.map(x => {
          return x
        })
      ),
      Router: O.merge(
        toNextScreen$, 
        toPreviousScreen$
      ),
      MapJSON: defaultNever(content, `MapJSON`),
      Storage: defaultNever(content, `Storage`),
      Global: defaultNever(content, `Global`),
      session$: state$
        .filter((x: any) => x.autosave === true)
        .map(x => x.contentState.session)
        .map(x => {
          return x
        }),
      save$: defaultNever(content, `save$`),
      saveStatus$: O.merge(
        actions.fromHTTP$.map(x => {
          return x
        }),
        toHTTP$.map(x => ({type: `saving`})).map(x => {
          return x
        })
      )
    }
  })
  .publishReplay(1).refCount()

  return {
    DOM: normalizeSink(component$, `DOM`),
    MapJSON: normalizeSink(component$, `MapJSON`),
    Router: normalizeSink(component$, `Router`),
    Global: normalizeSink(component$, `Global`),
    Storage: normalizeSink(component$, `Storage`),
    HTTP: normalizeSink(component$, `HTTP`),
    message$: normalizeSink(component$, `message$`),
    session$: normalizeSink(component$, `session$`),
    save$: normalizeSink(component$, `save$`),
    saveStatus$: normalizeSink(component$, `saveStatus$`)
  }
}