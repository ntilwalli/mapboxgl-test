import {Observable as O} from 'rxjs'
import {getCenterZoom} from '../../../util/map'
import {combineObj, between} from '../../../utils'
import {inflate} from '../listing'

const anchorId = `modifyLocationMapAnchor`

export default function intent(sources) {
  const {Router, MapJSON} = sources

  const mapAccessor = sources.MapJSON.select(anchorId)
  const mouseDown$ = mapAccessor.events(`mousedown`)
    .queryRenderedFilter({
      layers: [`marker`]
    })
    .filter(x => x && x.length)
    .publish().refCount()

  const mouseMoveEvents = mapAccessor.events(`mousemove`)

  const markerHover$ = mouseMoveEvents
    .queryRenderedFilter({
      layers: [`marker`]
    })
    .map(x => !!(x && x.length))
    .distinctUntilChanged()

  const mouseMove$ = mouseMoveEvents.observable
  const mouseUp$ = mapAccessor.events(`mouseup`).observable
  const markerMove$ = mouseMove$.let(between(mouseDown$, mouseUp$))
    .map(ev => ev.lngLat)



  const mapClick$ = mapAccessor.events(`click`).observable
     .map(ev => ev.lngLat)

  const mapMove$ = mapAccessor.events(`moveend`).observable
    .map(getCenterZoom)


  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .map(x => {
      return inflate(x)
    })
    .publishReplay(1).refCount()


  return {
    listing$,
    mapClick$,
    mapMove$,
    markerMove$,
    markerHover$
  }
}
