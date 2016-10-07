import {Observable as O} from 'rxjs'
import model from './model'
import {} from '../../utils'

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const status$ = state$

  return {
    status$
  }
}
