import {Observable as O} from 'rxjs'

export default function intent(sources) {
  const {DOM, Router} = sources

  const listing$ = Router.history$.map(x => x.state).cache(1)

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