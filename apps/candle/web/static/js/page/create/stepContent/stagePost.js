import {Observable as O} from 'rxjs'
import {div, button, span} from '@cycle/dom'
import Immutable from 'immutable'
import isolate from '@cycle/isolate'
import {inflate} from '../listing'
import {combineObj, createProxy, spread, normalizeComponent, normalizeSink, mergeSinks, defaultNever, processHTTP} from '../../../utils'


function intent(sources) {
  const {DOM, HTTP, Router} = sources
  const back$ = DOM.select(`.appBackButton`).events(`click`)
  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .map(x => {
      return inflate(x)
    })

  return { 
    back$,
    listing$
  }
}

function view(components) {
  return combineObj(components)
      .map(components => {
      const {content} = components
        return div(`.input-section`, [
          div(`.form-section`, [
            div(`.empty-section`),
            div(`.content-section`, [
              content
            ])
          ])
          , div(`.controller-section`, [
            div(`.separator`),
            div(`.button-section.justify-center`, [
              button(`.appBackButton.back-button`, [
                div(`.full.flex-center`, [
                  span(`.fa.fa-angle-left`),
                  span(`.back-text`, [`Back`])
                ])
              ])
            ])
          ])
        ])

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

    const vtree$ = view(components)

    const toPreviousScreen$ = actions.back$
      .withLatestFrom(actions.listing$, (_, listing) => {
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