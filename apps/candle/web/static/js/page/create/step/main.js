import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'
import Immutable from 'immutable'
import {combineObj, mergeSinks, normalizeComponent, spread, createProxy} from '../../../utils'

function processValid(response) {
  return response
}

function processHTTP(sources, cat) {
  const {HTTP} = sources

  const out$ = HTTP.select(cat)
    .switchMap(res$ => res$
      .map(res => {
        if (res.statusCode === 200) {
          return {
            type: "success",
            data: res.body
          }
        } else {
          return {
            type: `bad`,
            data: `Unsuccessful response from server`
          }
        }
      })
      .catch((e, orig$) => {
        return O.of({type: `ugly`, data: e.message})
      })
    ).share()

  return {
    good$: out$.filter(x => x.type === "success").map(x => x.data),
    bad$: out$.filter(x => x.type === "bad").map(x => x.data),
    ugly$: out$.filter(x => x.type === "ugly").map(x => x.data)
      .map(x => {
        return x
      })
  }

}

function intent(sources) {
  const {DOM, HTTP, Global} = sources
  
  const closeInstruction$ = O.merge(
    Global.filter(x => x.type === `thresholdUp`).map(x => {
      return x
    }),
    DOM.select(`.appCloseInstruction`).events(`click`)
  )

  const openInstruction$ =  DOM.select(`.appOpenInstruction`).events(`click`)
  const {good$, bad$, ugly$} = processHTTP(sources, `saveListing`)
  const fromHTTP$ = O.merge(
    good$.map(data => ({type: `saved`})), 
    bad$.map(data => ({type: `error`, data: data})), 
    ugly$.map(data => {
      return {type: `error`, data: data}
    }),
  ).map(x => {
    return x
  })


  return {
    closeInstruction$,
    openInstruction$,
    fromHTTP$
  }
}

function reducers(actions, inputs) {
  const closeInstructionR = actions.closeInstruction$.map(() => state => state.set(`showInstruction`, false))
  const openInstructionR = actions.openInstruction$.map(() => state => state.set(`showInstruction`, true))
  // const listingR = inputs.listing$.skip(1).map(val => state => {
  //   return state.set(`listing`, val)
  // })

  return O.merge(closeInstructionR, openInstructionR)//, listingR)
}

function model(actions, inputs) {
  const props$ = inputs.props$ || O.of({})
  const reducer$ = reducers(actions, inputs)
  return props$.map(props => {
    return {
      showInstruction: false,
      panelClass: props.panelClass || ``,
    }
  }).take(1)
    .switchMap(initialState => {
      return reducer$.startWith(Immutable.Map(initialState)).scan((acc, f) => f(acc))
    })
    .map(x => {
      return x
    })
    .map(x => x.toJS())
    // .do(x => {
    //   console.log(`step state`, x)
    // })
    .cache(1)
}

function view(state$, components) {
  return combineObj({state$, components: combineObj(components)})
    .map(info => {
      const {state, components} = info
      const {showInstruction, panelClass} = state
      const {heading, content, instruction} = components
      return div(`.create-panel${panelClass ? '.' + panelClass : ''}`, [
        heading,
        div(`.content-body`, [
          div(`.left-side`, [
            content,
            !showInstruction ? div(`.appOpenInstruction.instruction-section.hide`, [
              span(`.icon.fa.fa-lightbulb-o`)
            ]) :
            div(`.instruction-section.show`, [
              span(`.appCloseInstruction.close-icon`),
              span(`.icon.fa.fa-lightbulb-o`),
              instruction
            ])
          ]),
          div(`.right-side`, [
            div(`.instruction-section`, [
              div([
                span(`.icon.fa.fa-lightbulb-o`),
                instruction
              ])
            ])
          ])
        ])
      ])
    })
}

export default function main(sources, inputs) {
  const {headingGenerator, content, instruction} = inputs

  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const saving$ = createProxy()
  const heading = headingGenerator(saving$)
  const save$ = O.merge(content.save$, heading.save$)
    .map(x => {
      return x
    })

  const toHTTP$ = save$.withLatestFrom(content.listing$, (_, listing) => {
    return {
      url: `/api/user`,
      method: `post`,
      type: `json`,
      send: {
        route: `/listing/save`,
        data: listing
      },
      category: `saveListing`
    }
  }).map(x => {
    return x
  })
  .share()

  saving$.attach(O.merge(
    toHTTP$.mapTo({
      type: `saving`
    }),
    actions.fromHTTP$
  ))

  const components = {
    heading$: heading.DOM,
    content$: content.DOM,
    instruction$: instruction.DOM
  }

  const vtree$ = view(state$, components)

  return spread(mergeSinks(heading, content, instruction), {
    DOM: vtree$,
    HTTP: toHTTP$
      .map(x => {
        return x
      })
  })
}