import {Observable as O} from 'rxjs'

export default function intent(sources) {
  const {DOM, Router} = sources

  const listing$ = Router.history$.take(1).map(x => x.state).publishReplay(1).refCount()

  const description$ = DOM.select(`.appDescriptionInput`).events(`input`)
    .map(ev => ev.target.value)
  const shortDescription$ = DOM.select(`.appShortDescriptionInput`).events(`input`)
    .map(ev => ev.target.value)
  const categories$ = DOM.select(`.appCategoriesInput`).events(`input`)
      .map(ev => ev.target.value)
  
  return {
    description$, shortDescription$, categories$, listing$
  }
}