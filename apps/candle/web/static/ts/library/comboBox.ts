import {Observable as O} from 'rxjs'
import {div, select, option} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../utils'

function getTextFromOption(opt) {
  return (opt.substring(0, 1).toUpperCase() + opt.substring(1)).replace(/_/g, ' ').replace(/and/g, '+')
}

export default function StyledComboBox(sources, options, props$, style_class = '') {
  const shared$ = props$
    .map(x => {
      return x
    })
    .publishReplay(1).refCount()
  const click$ = sources.DOM.select(`.appComboBoxSelect`).events('change')
    .map(ev => {
      return ev.target.value
    })
  const state$ = O.merge(shared$, click$).publishReplay(1).refCount()
  const vtree$ = shared$.map(state => {
    return select(`.appComboBoxSelect.form-control` + style_class, options.map(opt => {
        return option({attrs: {value: opt, selected: state === opt}}, [
          getTextFromOption(opt)
        ])
      }))
  })

  return {
    DOM: vtree$,
    output$: state$
  }
} 
