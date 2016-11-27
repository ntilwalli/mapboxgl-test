import {Observable as O} from 'rxjs'

export default function intent(sources) {
  const {DOM, Router} = sources
  const type$ = DOM.select(`.appCuandoTypeComboBox`).events(`click`)
  return {
    type$,
    session$: Router.history$.pluck(`state`).pluck(`data`),
  }
}