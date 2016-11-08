import {Observable as O} from 'rxjs'

export default function intent({DOM}) {
  const userType$ = O.merge(
    DOM.select(`.appAccountTypeIndividual`).events(`click`),
    DOM.select(`.appAccountTypeGroup`).events(`click`)
  ).map((ev: any) => ev.target.value)

  const github$ = DOM.select(`.appGithubLink`).events(`click`)
  const facebook$ = DOM.select(`.appFacebookLink`).events(`click`)
  const twitter$ = DOM.select(`.appTwitterLink`).events(`click`)

  const submit$ = DOM.select(`.appSignupButton`).events(`click`)
    .publishReplay(1).refCount()
  const switchToLogin$ = DOM.select(`.appSwitchToLoginButton`).events(`click`)

  //submit$.subscribe(x => console.log(`submitted`))

  return {
    userType$,
    submit$,
    github$,
    facebook$,
    twitter$,
    switchToLogin$
  }
}