import {Observable as O} from 'rxjs'
import {div, button, span} from '@cycle/dom'
import Immutable from 'immutable'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, spread, normalizeComponent, normalizeSink, mergeSinks, defaultNever, processHTTP} from '../../../utils'


function intent(sources) {
  const {DOM, HTTP} = sources
  const post$ = DOM.select(`.appPostButton`).events(`click`)
  const back$ = DOM.select(`.appBackButton`).events(`click`)
  const {good$, bad$, ugly$} = processHTTP(sources, `postListing`)
  const posted$ = good$.filter(x => x.type === `posted`)
    .map(x => {
      return x.data
    })
    .publish().refCount()
  const notPosted$ = O.merge(
    good$.filter(x => x.type !== `posted`)
      .map(x => {
        return x.data
      }),
    bad$,
    ugly$
  )


  const fromHTTP$ = O.merge(
    posted$,
    bad$,
    ugly$,
  )

  return {
    post$, 
    back$, 
    posted$,
    notPosted$
  }
}

function reducers(actions, inputs) {
  const postedR = actions.posted$.map(() => state => {
    return state.set(`posting`, `success`)
  }).publishReplay(1).refCount()

  const notPostedR = actions.notPosted$.map(() => state => {
    return state.set(`posting`, `fail`)
  })

  const postingR = inputs.posting$.map(() => state => {
    return state.set(`posting`, true)
  })

  const validR = inputs.contentState$.skip(1)
    .map(val => state => {
      return state.set(`contentState`, val)
    })

  return O.merge(validR, postedR, notPostedR, postingR)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.contentState$.take(1)
    .map(contentState => {
      return {
        posting: false,
        waiting: false,
        contentState
      }
    })
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`stepComponent state`, x))
    .publishReplay(1).refCount()
}

function getPostingDisplay(info) {
  const {posting} = state
  const icon = posting === `true` ? span(`.spinner`, []) : posting === `posted` ? span(`.fa-check`, []) : null
  const text = posting === `true` ? span(`.post-text`, [`Posting...`]) : posting === `posted` ? span('.post-text' + disabled, ['Posted!']) : span('.post-text' + disabled, ['Failed!!'])
  return span(`.posting-display`, [
    icon,
    text 
  ])
}

function view(state$, components) {
  return combineObj(components)
    .withLatestFrom (state$, (components, state) => ({state, components}))
      .map(info => {
      const {state, components} = info
      const {contentState, posting, waiting} = state
      const {content} = components

      if (waiting) {
        return div(`.panel.modal`, [`Waiting`])
      } else {
        const disabled = posting ? '.disabled' : ''
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
              button('.appPostButton.next-button' + disabled, [
                !posting ? 
                  span('.post-text' + disabled, ['Post'])
                  : getPostingDisplay(info)
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
    const posting$ = createProxy()

    const state$ = model(actions, spread(inputs, {
      contentState$: content.state$,
      posting$
    }))

    const vtree$ = view(state$, components)
    
    const post$ = actions.post$
      .withLatestFrom(state$, (_, state) => {
        const {contentState} = state
        const {listing} = contentState
        return listing
      }).publish().refCount()

    const toHTTP$ = post$
      .map(x => {
        return {
          url: `/api/user`,
          method: `post`,
          type: `json`,
          send: {
            route: `/listing/post`,
            data: listing
          },
          category: `postListing`
        }
      })
      .publish().refCount()

    posting$.attach(toHTTP$)

    const toConfirmed$ = actions.posted$
      .withLatestFrom(state$, (_, state) => {
        return {
          pathname: `/create/postingSuccess`,
          action: `PUSH`,
          state: listing
        }
      })

    const toPreviousScreen$ = actions.back$
      .withLatestFrom(state$, (_, state) => {
        const {contentState} = state
        const {listing} = contentState

        let previousScreen = previous
        if (typeof previous === 'function') {
          previousScreen = previous(listing)
        }

        const pathname = `/create/${listing.id}/${previousScreen}`
        return {
          pathname,
          action: `PUSH`,
          state: listing
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
      HTTP: O.merge(
        defaultNever(content, `HTTP`),
        toHTTP$.map(x => {
          return x
        })
      ),
      Router: O.merge(
        toConfirmed$,
        toPreviousScreen$,
        defaultNever(content, `Router`),
      ),
      MapDOM: defaultNever(content, `MapDOM`),
      Storage: defaultNever(content, `Storage`),
      Global: defaultNever(content, `Global`),
      listing$: state$
        .map(x => {
          return x.contentState.listing
        }),
      save$: defaultNever(content, `save$`)
    }
  })
  .publishReplay(1).refCount()

  return {
    DOM: normalizeSink(component$, `DOM`),
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