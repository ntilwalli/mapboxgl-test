function fromCheckbox(ev) {
  return {
    value: ev.target.value,
    checked: ev.target.checked
  }
}
export default function intent(sources) {
  const {DOM} = sources  
  const type$ = DOM.select('.appTypeInput').events('click')
    .map(fromCheckbox)

   const registration_type$ = DOM.select('.appRegistrationTypeInput').events('click')
     .map(ev => {
       return ev.target.value
     })

   const in_person_style$ = DOM.select('.appInPersonStyleInput').events('click')
     .map(fromCheckbox)
    
  return {
    type$,
    registration_type$,
    in_person_style$
  }
}