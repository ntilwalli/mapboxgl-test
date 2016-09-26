import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'
import Immutable from 'immutable'
import {combineObj, mergeSinks, normalizeSink, normalizeComponent, defaultNever, spread, createProxy, processHTTP} from '../../../utils'

function processValid(response) {
  return response
}



function intent(sources) {
  const {DOM, Router, HTTP, Global} = sources
  
  const route$ = Router.history$.take(1)
    .map(x => {
      const path = x.pathname
      const m = /^\/create\/([0-9]*\/)?(.*)\/?$/.exec(path)
      return {
        id: m[1],
        stepName: m[2]
      }
    })
    //.publishReplay(1).refCount()


  const closeInstruction$ = O.merge(
    Global.filter(x => x.type === `thresholdUp`).map(x => {
      return x
    }),
    DOM.select(`.appCloseInstruction`).events(`click`)
  )

  const openInstruction$ =  DOM.select(`.appOpenInstruction`).events(`click`)
  const {good$, bad$, ugly$} = processHTTP(sources, `saveListing`)
  const created$ = good$
    .map(x => {
      return x
    })
    .filter(x => x.type === `created`)
    //.map(x => x.data)
    .publish().refCount()
  const saved$ = good$
    .filter(x => x.type === `saved`)
    //.map(x => x.data)
    .publish().refCount()
  const error$ = good$
    .filter(x => x.type === `error`)
    //.map(x => x.data)
    .publish().refCount()

  const problem$ = O.merge(
    bad$, ugly$
  ).map(x => ({
      type: `problem`,
      data: x
    }))

  const fromHTTP$ = O.merge(
    created$,
    saved$,
    error$,
    problem$
  ).map(x => {
    return x
  })


  return {
    closeInstruction$,
    openInstruction$,
    fromHTTP$,
    created$,
    route$
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
    .publishReplay(1).refCount()
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
  const save$ = O.merge(
    defaultNever(content, `save$`), 
    defaultNever(heading, `save$`)
  ).map(x => {
      return x
    })

  const listing$ = defaultNever(content,`listing$`)

  const toHTTP$ = save$.withLatestFrom(listing$, (_, listing) => {
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
  .publish().refCount()

  const saveStatus$ = O.merge(
    toHTTP$.mapTo({
      type: `saving`
    }).map(x => {
          return x
        }),
    actions.fromHTTP$.map(x => {
          return x
        })
  )

  saving$.attach(O.merge(
    saveStatus$,
    defaultNever(content, `saveStatus$`)
  ))

  const components = {
    heading$: heading.DOM,
    content$: content.DOM,
    instruction$: instruction.DOM
  }

  const vtree$ = view(state$, components)

  const mergeableSinks = {
    HTTP: toHTTP$
      .map(x => {
        return x
      }),
    Router: actions.created$.withLatestFrom(actions.route$, (created, route) => {
      const {data} = created
      const listing = data
      const {stepName} = route
      return {
        pathname: `/create/${listing.id}/${stepName}`,
        action: `PUSH`,
        state: listing
      }
    })
  }
  
  return spread(mergeSinks(heading, content, instruction, mergeableSinks), {
    DOM: vtree$
  })

  // return {
  //   DOM: O.of(div([`Hello`]))//vtree$
  // }
}