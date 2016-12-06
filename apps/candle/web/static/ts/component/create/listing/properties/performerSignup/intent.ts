export default function intent(sources) {
  const {DOM} = sources  
  const type$ = DOM.select('.appTypeInput').events('click')
    .map(ev => {
      return {
        value: ev.target.value,
        checked: ev.target.checked
      }
    })

   const registration_type$ = DOM.select('.appRegistrationTypeInput').events('click')
     .map(ev => {
       return ev.target.value
     })
    
  return {
    type$,
    registration_type$
  }
}