import {Observable as O} from 'rxjs'
import {inflate} from '../listing'

export default function intent(sources) {
  const {DOM, Router} = sources

  const session$ = Router.history$
    .take(1)
    .map(route => inflate(route.state))
    .publishReplay(1).refCount()

  const description$ = DOM.select(`.appDescriptionInput`).events(`input`)
    .map(ev => ev.target.value)
  const shortDescription$ = DOM.select(`.appShortDescriptionInput`).events(`input`)
    .map(ev => ev.target.value)
  const categories$ = DOM.select(`.appCategoriesInput`).events(`input`)
      .map(ev => ev.target.value)
  
  return {
    description$, shortDescription$, categories$, session$
  }
}