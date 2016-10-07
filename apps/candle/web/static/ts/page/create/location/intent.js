import {Observable as O} from 'rxjs'
import {getCenterZoom} from '../../../util/map'
import {targetIsOwner, combineObj} from '../../../utils'
import FactualGeotagService from '../../../thirdParty/FactualGeotagService'
import {inflate} from '../listing'

export default function intent(sources) {
  const {DOM, Router} = sources
  const showSearchAreaScreen$ = DOM.select(`.appChangeSearchAreaButton`).events(`click`)
    .mapTo(true)

  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .map(x => {
      return inflate(x)
    })
    .publishReplay(1).refCount()

  return {
    showSearchAreaScreen$: showSearchAreaScreen$,
    listing$
  }
}
