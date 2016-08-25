import xs from 'xstream'

export default function intent(sources) {
  const thresholdExceeded$ = sources.Global
    .filter(x => x.type && x.type === `thresholdUp`)
    .map(x => x.data)

  const closeInstruction$ = xs.merge(
    sources.DOM.select(`.appModalBackdrop`).events(`click`),
    sources.DOM.select(`.appCloseInstruction`).events(`click`),
    thresholdExceeded$
  )

  const openInstruction$ = sources.DOM.select(`.appOpenInstruction`).events(`click`)



  return {
    closeInstruction$,
    openInstruction$,
    thresholdExceeded$
  }
}
