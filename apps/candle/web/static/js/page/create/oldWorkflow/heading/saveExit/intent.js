import xs from 'xstream'

export default function intent(sources) {
  const saveExit$ = sources.DOM.select(`.appSaveExit`).events(`click`).mapTo({type: `saveExit`})
  const logout$ = sources.DOM.select(`.appLogOut`).events(`click`).mapTo({type: `logout`})

  return {
    saveExit$,
    logout$
  }
}
