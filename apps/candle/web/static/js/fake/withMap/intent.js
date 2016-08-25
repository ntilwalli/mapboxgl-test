export default function view(sources) {
  const {DOM} = sources
  
  return {
    showModal$: DOM.select(`.showModal`).events(`click`)
      .mapTo(true)
      .share(),
    logout$: DOM.select(`.logout`).events(`click`),
    login$: DOM.select(`.login`).events(`click`),
    signup$: DOM.select(`.signup`).events(`click`),
    presignup$: DOM.select(`.presignup`).events(`click`),
    showLeftMenu$: DOM.select(`.showLeftMenu`).events(`click`)
  }
}
