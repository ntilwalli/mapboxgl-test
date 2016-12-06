export default function intent(sources) {
  const {DOM} = sources
  const type$ = DOM.select('.appTypeInput').events('click')
    .map(ev => {
      return {
        value: ev.target.value,
        checked: ev.target.checked
      }
    })
    
  return {
    type$
  }
}