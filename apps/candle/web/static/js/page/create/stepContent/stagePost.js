import {Observable as O} from 'rxjs'
import {div, button, span} from '@cycle/dom'
import Immutable from 'immutable'
import isolate from '@cycle/isolate'
import {combineObj, createProxy, spread, normalizeComponent, normalizeSink, mergeSinks, defaultNever, processHTTP} from '../../../utils'


function intent(sources) {
  const {DOM, HTTP} = sources
  const back$ = DOM.select(`.appBackButton`).events(`click`)

  return { 
    back$
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
    .publishReplay(1).refCount()
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
        defaultNever(content, `HTTP`)
      ),
      Router: O.merge(
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