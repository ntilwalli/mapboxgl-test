import {Observable as O} from 'rxjs'
import {div, button, span} from '@cycle/dom'
import Immutable from 'immutable'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, spread, normalizeComponent, normalizeSink, mergeSinks, defaultNever, processHTTP} from '../../../utils'


function intent(sources) {
  const {DOM, HTTP, Environment} = sources
  const next$ = DOM.select(`.appNextButton`).events(`click`)
  const back$ = DOM.select(`.appBackButton`).events(`click`)
  const {good$, bad$, ugly$} = processHTTP(sources, `saveListingOnNext`)
  
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

  const updatedListing$ = O.merge(created$, saved$).map(x => x.data)

  return {
    next$, back$, fromHTTP$, created$, updatedListing$, environment$: Environment
  }
}

function reducers(actions, inputs) {
  const savedListingR = defaultNever(inputs, `listing$`).map(x => state => {
    const cs = state.get(`contentState`)
    cs.listing = x
    return state.set(`contentState`, cs).set(`autosave`, false)
  })
  const validR = inputs.contentState$.skip(1)
    .map(val => state => {
      return state.set(`contentState`, val).set(`autosave`, true)
    })

  return O.merge(validR, savedListingR)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
    contentState$: inputs.contentState$.take(1),
    environment$: actions.environment$
  }).map(info => {
      const {contentState, environment} = info
      return {
        environment,
        waiting: false,
        contentState,
        autosave: true
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`stepComponent state`, x))
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj(components).debounceTime(4)
    .withLatestFrom (state$, (components, state) => {
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
              //button(`.appNextButton.next-button${state.listing  && state.listing.type ? '' : '.disabled'}`, [
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
    const {contentComponent, create, nextRequiresListingId, previous, next} = props
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
        const {listing} = contentState

        let nextScreen = next
        if (typeof next === 'function') {
          nextScreen = next(listing)
        }

        if (listing.id) {
          return {
            type: "Router",
            data: {
              pathname: `/create/${listing.id}/${nextScreen}`,
              action: `PUSH`,
              state: listing
            }
          }
        } else if (!nextRequiresListingId) {
          const out = {
            type: "Router",
            data: {
              pathname: `/create/${nextScreen}`,
              action: `PUSH`,
              state: listing
            }
          }

          return out
        } else {
          return {
            type: "HTTP",
            data: listing
          }
        }
      }).publish().refCount()
    
    const requestedSaveListing$ = decision$
      .filter(x => x.type === `HTTP`)
      .map(x => x.data)
      .publish().refCount()

    const toHTTP$ = requestedSaveListing$
      .map(x => {
        const listing = x
        return {
          url: `/api/user`,
          method: `post`,
          type: `json`,
          send: {
            route: `/listing/save`,
            data: listing
          },
          category: `saveListingOnNext`
        }
      })
      .publish().refCount()

    const toNextScreen$ = O.merge(
      decision$.filter(x => x.type === "Router").map(x => x.data),
      actions.created$.map(x => x.data).map(listing => {
        let nextScreen = next
        if (typeof next === 'function') {
          nextScreen = next(listing)
        }
        return {
          pathname: `/create/${listing.id}/${nextScreen}`,
          action: `PUSH`,
          state: listing
        }
      })
    )
    

    const toPreviousScreen$ = actions.back$
      .withLatestFrom(state$, (_, state) => {
        const {contentState} = state
        const {listing} = contentState

        let previousScreen = previous
        if (typeof previous === 'function') {
          previousScreen = previous(listing)
        }

        if (listing.id) {
          const pathname = previous ? `/create/${listing.id}/${previousScreen}` : `/create/${listing.id}`
          return {
            pathname,
            action: `PUSH`,
            state: listing
          }
        } else {
          const pathname = previous ? `/create/${previousScreen}` : `/create`
          return {
            pathname,
            action: `PUSH`,
            state: listing
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
      MapDOM: defaultNever(content, `MapDOM`),
      Storage: defaultNever(content, `Storage`),
      Global: defaultNever(content, `Global`),
      listing$: state$
        .filter(x => x.autosave === true)
        .map(x => x.contentState.listing)
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
    MapDOM: normalizeSink(component$, `MapDOM`),
    Router: normalizeSink(component$, `Router`),
    Global: normalizeSink(component$, `Global`),
    Storage: normalizeSink(component$, `Storage`),
    HTTP: normalizeSink(component$, `HTTP`),
    message$: normalizeSink(component$, `message$`),
    listing$: normalizeSink(component$, `listing$`),
    save$: normalizeSink(component$, `save$`),
    saveStatus$: normalizeSink(component$, `saveStatus$`)
  }
}