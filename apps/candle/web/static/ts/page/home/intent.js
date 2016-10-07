import xs from 'xstream'
import Immutable from 'immutable'
import {targetIsOwner} from '../../utils'

export default function intent({DOM, HTTP, Router, Global}) {
  const openMenuModal$ = DOM.select(`.appOpenMenuModal`).events(`click`)
  const thresholdExceeded$ = Global
    .filter(x => x.type && x.type === `thresholdUp`)
    .map(x => x.data)
  const closeModalClicked$ = xs.merge(
    DOM.select(`.appModal`).events(`click`)
      .filter(targetIsOwner),
    DOM.select(`.appModalClose`).events(`click`)
  ).map(x => {
    return x
  })

  const modal$ = Router.history$
    //.debug(`modal route`)
    .map(({pathname}) => {
      if (pathname === "/login") return `login`
      if (pathname === "/signup") return `signup`
      if (pathname === "/presignup") return `presignup`

      return null
    })

  const searchConfigurationClicked$ = DOM.select(`.appSearchConfiguration`).events(`click`)

  return {
    openMenuModal$,
    thresholdExceeded$,
    closeModalClicked$,
    searchConfigurationClicked$,
    modal$
  }
}
