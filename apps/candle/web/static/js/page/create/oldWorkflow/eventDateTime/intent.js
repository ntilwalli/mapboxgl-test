import xs from 'xstream'

export default function intent(sources) {
  return {
    next$: sources.DOM.select(`.appNextButton`).events(`click`),
    back$: sources.DOM.select(`.appBackButton`).events(`click`)
  }
}
