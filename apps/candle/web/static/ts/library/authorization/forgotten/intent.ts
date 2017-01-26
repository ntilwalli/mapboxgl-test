import {Observable as O} from 'rxjs'

export default function intent(sources) {
  const {DOM} = sources
  const submit$ = DOM.select('.appSubmitForgottenEmailButton').events('click')
    .map(x => {
      return x
    })
    .publish().refCount()


  return {
    submit$
  }
}
