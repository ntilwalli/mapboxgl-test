import {Observable as O} from 'rxjs'
import {div, svg} from '@cycle/dom'
import Immutable = require('immutable')
import moment = require('moment')
import {combineObj, traceStartStop} from '../utils'

const {g, rect, text} = svg

function intent(sources) {
  const {DOM} = sources

  return {
    click$: DOM.select(`.appPos`).events(`click`).map(ev => parseInt(ev.target.getAttribute(`data-pos`)))
  }
}

function reducers(actions, inputs) {
  const click_r = actions.click$.map(val => state => {
    //console.log(`click`, val)
    return state.update(`bysetpos`, bysetpos => {
      const index = bysetpos.indexOf(val)
      if (index >= 0) {
        bysetpos.splice(index, 1)
        return bysetpos
      } else {
        bysetpos.push(val)
        return bysetpos
      }
    })
  })

  return O.merge(click_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return combineObj({
      props: inputs.props$
    })
    .switchMap((info: any) => {
      //console.log(`info`, info)
      const {props} = info
      const init = {
        bysetpos: props || []
      }

      //console.log(`init`, init)
      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    // .do(x => console.log(`weekday selector state`, x))
    // .letBind(traceStartStop(`weekday selector state trace`))
    .publishReplay(1).refCount()
}


const positions = [
  [`1st`, 1],
  [`2nd`, 2],
  [`3rd`, 3],
  [`4th`, 4],
  [`Last`, -1]
]

function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {bysetpos} = state
      const out = div(`.bysetpos-selector`, positions.map(([text, val]) => {
        // console.log({text, val})
        // console.log(bysetpos)
        return div(`.appPos.pos`, {
          attrs: {'data-pos': val},
          class: {
            selected: bysetpos.some(pos => pos === val)
          }
        }, [text])
      }))

      return out
    }) 
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$, {})
  return {
    DOM: vtree$,
    output$: state$.pluck(`bysetpos`)
  }
}