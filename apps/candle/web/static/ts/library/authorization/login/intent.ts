import {Observable as O} from 'rxjs'

export default function intent(sources) {
  const {DOM} = sources
  const github$ = DOM.select(`.appGithubLink`).events(`click`)
  const facebook$ = DOM.select(`.appFacebookLink`).events(`click`)
  const twitter$ = DOM.select(`.appTwitterLink`).events(`click`)

  const submit$ = DOM.select(`.appLoginButton`).events(`click`)
    // .publishReplay(1).refCount()

  const signup$ = DOM.select(`.appSwitchToSignupButton`).events(`click`)
  return {
    submit$,
    github$,
    facebook$,
    twitter$,
    signup$
  }
}
