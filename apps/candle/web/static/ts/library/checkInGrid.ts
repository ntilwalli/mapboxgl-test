import {Observable as O} from 'rxjs'
import {div, svg} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, spread} from '../utils'

const {g, rect, polygon} = svg

function intent(sources) {
  const {DOM} = sources

  const click$ = DOM.select(`.foo-grid`).select(`.element`).events(`click`)
    .publishReplay(1).refCount()

  click$.subscribe(x => console.log(`clicked: `, x))

  return {
    click$
  }
} 

function view(state$) {
  return state$.map(state => {
    return div(`.foo-grid-container`, [
      svg({attrs: {width: 150, height: 150}}, [
        rect({
          attrs: {
            width: 20,
            height: 20,
            x: 13,
            y: 0,
            fill: "#d6e685",
          }
        })
      ])
    ])
  })
}
export function main(sources, inputs) {
  const state$ = O.of(undefined)
  const vtree$ = view(state$) 
  return {
    DOM: vtree$
  }
}