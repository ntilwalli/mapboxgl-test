import {Observable as O} from 'rxjs'
import {normalizeComponent} from './utils'
import LeftMenuModal from './library/leftMenuModal'

function getModal(type, sources, inputs): any {
  console.log(type)
  if (type === "leftMenu") {
    return LeftMenuModal(sources, inputs)
  } else {
    return normalizeComponent({
      DOM: O.of(null),
      Router: O.never(),
      close$: O.never()
    })
  }
}

export default getModal
