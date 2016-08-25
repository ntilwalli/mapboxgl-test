import {Observable as O} from 'rxjs'
import {div, span} from '@cycle/dom'
import Immutable from 'immutable'
import {combineObj, mergeSinks, normalizeComponent, spread} from '../../../utils'

function intent(sources) {
  const {DOM, Global} = sources
  
  const closeInstruction$ = O.merge(
    Global.filter(x => x.type === `thresholdUp`).map(x => {
      return x
    }),
    DOM.select(`.appCloseInstruction`).events(`click`)
  )

  const openInstruction$ =  DOM.select(`.appOpenInstruction`).events(`click`)

  return {
    closeInstruction$,
    openInstruction$
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
  const {heading, content, instruction} = inputs
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const components = {
    heading$: heading.DOM,
    content$: content.DOM,
    instruction$: instruction.DOM
  }
  const vtree$ = view(state$, components)
  return spread(mergeSinks(heading, content, instruction), {
    DOM: vtree$,
    HTTP: heading.save$.withLatestFrom(content.listing$, (_, listing) => {
      return {
        url: `blah`

      }
    })
    .filter(() => false)
  })
}