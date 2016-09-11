import {Observable as O} from 'rxjs'
import {div, button, span} from '@cycle/dom'
import Immutable from 'immutable'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, spread, normalizeComponent, normalizeSink, mergeSinks, defaultNever, processHTTP} from '../../../utils'


function intent(sources) {
  const {DOM, HTTP} = sources
  const next$ = DOM.select(`.appNextButton`).events(`click`)
  const back$ = DOM.select(`.appBackButton`).events(`click`)
  const {good$, bad$, ugly$} = processHTTP(sources, `saveListingOnNext`)
  const created$ = good$.filter(x => x.type === `created`)
    .map(x => {
      return x
    })
    .share()
  const saved$ = good$.filter(x => x.type === `saved`)
  const fromHTTP$ = O.merge(
    created$,
    saved$,
    bad$,
    ugly$,
  )

  return {
    next$, back$, fromHTTP$, created$
  }
}

function reducers(actions, inputs) {
  const validR = inputs.contentState$.skip(1)
    .map(val => state => {
      return state.set(`contentState`, val)
    })

  return O.merge(validR)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.contentState$.take(1)
    .map(contentState => {
      return {
        waiting: false,
        contentState
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`stepComponent state`, x))
    .cache(1)
}

function view(state$, components) {
  return combineObj(components)
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
                span(`.fa.fa-angle-left`),
                span(`.back-text`, [`Back`])
              ]),
              //button(`.appNextButton.next-button${state.listing  && state.listing.type ? '' : '.disabled'}`, [
              button('.appNextButton.next-button' + disabled, [
                span('.next-text' + disabled, ['Next']),
                span('.fa.fa-angle-right' + disabled)
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
        if (listing.id) {
          return {
            type: "Router",
            data: {
              pathname: `/create/${listing.id}/${next}`,
              action: `PUSH`,
              state: listing
            }
          }
        } else if (!nextRequiresListingId) {
          const out = {
            type: "Router",
            data: {
              pathname: `/create/${next}`,
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
      }).share()

    const toHTTP$ = decision$.filter(x => x.type === "HTTP")
      .map(x => {
        const listing = x.data
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
      .share()

    const toNextScreen$ = O.merge(
      decision$.filter(x => x.type === "Router").map(x => x.data),
      actions.created$.map(x => x.data).map(listing => {
        return {
          pathname: `/create/${listing.id}/${next}`,
          action: `PUSH`,
          state: listing
        }
      })
    )
    

    const toPreviousScreen$ = actions.back$
      .withLatestFrom(state$, (_, state) => {
        const {contentState} = state
        const {listing} = contentState

        if (listing.id) {
          const pathname = previous ? `/create/${listing.id}/${previous}` : `/create/${listing.id}`
          return {
            pathname,
            action: `PUSH`,
            state: listing
          }
        } else {
          const pathname = previous ? `/create/${previous}` : `/create`
          return {
            pathname,
            action: `PUSH`,
            state: listing
          }
        }
      })

    // const mergableSinks = {
    //   HTTP: toHTTP$.map(x => {
    //     return x
    //   }),
    //   Router: O.merge(
    //     toNextScreen$, 
    //     toPreviousScreen$
    //   )
    // }

    // return spread(mergeSinks(mergableSinks, content), {
    //   DOM: vtree$,//.do(x => console.log(`Got DOM`, x)),
    //   listing$: state$
    //     .map(x => x.contentState.listing)
    //     .map(x => {
    //       return x
    //     }),
    //   save$: defaultNever(content, `save$`),
    //   saveStatus$: O.merge(
    //     actions.fromHTTP$,
    //     toHTTP$.map(x => ({type: `saving`}))
    //   )
    // })

    return {
      DOM: vtree$,
      HTTP: toHTTP$.map(x => {
        return x
      }),
      Router: O.merge(
        toNextScreen$, 
        toPreviousScreen$
      ),
      MapDOM: defaultNever(content, `MapDOM`),
      Storage: defaultNever(content, `Storage`),
      Global: defaultNever(content, `Global`),
      listing$: state$
        .map(x => x.contentState.listing)
        .map(x => {
          return x
        }),
      save$: defaultNever(content, `save$`),
      saveStatus$: O.merge(
        actions.fromHTTP$,
        toHTTP$.map(x => ({type: `saving`}))
      )

    }

  })
  .cache(1)

  return {
    DOM: normalizeSink(component$, `DOM`),
    MapDOM: normalizeSink(component$, `MapDOM`),
    Router: normalizeSink(component$, `Router`),
    Global: normalizeSink(component$, `Global`),
    Storage: normalizeSink(component$, `Storage`),
    HTTP: normalizeSink(component$, `HTTP`).map(x => {
      return x
    }),
    message$: normalizeSink(component$, `message$`),
    listing$: normalizeSink(component$, `listing$`),
    save$: normalizeSink(component$, `save$`),
    saveStatus$: normalizeSink(component$, `saveStatus$`)
  }
}