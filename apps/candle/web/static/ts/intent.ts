import {Observable as O} from 'rxjs'
function intent(sources) {
  const {Router} = sources

  const path$ = Router.history$
    .subscribe(x => console.log(`history`, x))

  return {
    showLogin$: O.never(),
    showSignup$: O.never(),
    showPresignup$: O.never()
  }

}

export default intent