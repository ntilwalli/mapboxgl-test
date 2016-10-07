import {Observable as O} from 'rxjs'

export default function intent({DOM}) {
  const userType$ = O.merge(
    DOM.select(`.appAccountTypeIndividual`).events(`click`),
    DOM.select(`.appAccountTypeGroup`).events(`click`)
  ).map(ev => ev.target.value)

  const submit$ = DOM.select(`.appSignUpButton`).events(`click`)

  return {
    userType$,
    submit$
  }
}
