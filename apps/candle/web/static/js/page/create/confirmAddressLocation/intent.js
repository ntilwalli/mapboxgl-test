import {Observable as O} from 'rxjs'
import {getCenterZoom} from '../../../util/map'
import {combineObj} from '../../../utils'

export default function intent(sources) {
  const {DOM, MapDOM} = sources
  const mapClick$ = MapDOM.chooseMap(`modifyLocationMapAnchor`).select(`.modifyLocationMap`).events(`click`)
     .map(ev => ev.latlng)

  const mapMove$ = MapDOM.chooseMap(`modifyLocationMapAnchor`).select(`.modifyLocationMap`).events(`moveend`)
    .do(x => {
      console.log(`mapMove`, x)
    })
    .map(getCenterZoom)
    .cache(1)

  return {
    next$: DOM.select(`.appNextButton`).events(`click`),
    back$: DOM.select(`.appBackButton`).events(`click`),
    mapClick$,
    mapMove$//,
    //dragMarker$
  }
}
