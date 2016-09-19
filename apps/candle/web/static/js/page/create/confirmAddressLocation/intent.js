import {Observable as O} from 'rxjs'
import {getCenterZoom} from '../../../util/map'
import {combineObj} from '../../../utils'

export default function intent(sources) {
  const {Router, MapDOM} = sources
  const mapClick$ = MapDOM.chooseMap(`modifyLocationMapAnchor`).select(`.modifyLocationMap`).events(`click`)
     .map(ev => ev.latlng)

  const mapMove$ = MapDOM.chooseMap(`modifyLocationMapAnchor`).select(`.modifyLocationMap`).events(`moveend`)
    // .do(x => {
    //   console.log(`mapMove`, x)
    // })
    .map(getCenterZoom)
    //.publish().refCount()

  const markerMove$ = MapDOM.chooseMap(`modifyLocationMapAnchor`).select(`#latLngMarker`).events(`dragstart`)
    .switchMap(_ => MapDOM.chooseMap(`modifyLocationMapAnchor`).select(`#latLngMarker`).events(`dragend`))
    // .do(x => {
    //   console.log(`markerMove`, x)
    // })
    .map(ev => ev.target._latlng)

  const listing$ = Router.history$.take(1).map(x => x.state).publishReplay(1).refCount()


  return {
    listing$,
    mapClick$,
    mapMove$,
    markerMove$
  }
}
