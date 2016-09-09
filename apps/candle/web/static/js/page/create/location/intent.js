import {Observable as O} from 'rxjs'
import {getCenterZoom} from '../../../util/map'
import {targetIsOwner, combineObj} from '../../../utils'
import FactualGeotagService from '../../../thirdParty/FactualGeotagService'
import {getVicinityFromMapLocation} from './utils'

export default function intent(sources) {
  const {DOM, MapDOM, HTTP, Router} = sources
  const showVicinityScreen$ = DOM.select(`.appChangeVicinityButton`).events(`click`)
    .mapTo(true)
  const hideVicinityScreen$ = O.merge(
    DOM.select(`.appModal`).events(`click`)
      .filter(targetIsOwner),
    DOM.select(`.appModalClose`).events(`click`)
      .filter(targetIsOwner)
  ).mapTo(false)

  const mapClick$ = MapDOM.chooseMap(`addEventMapAnchor`).select(`.addEventMap`).events(`click`)
     .map(ev => ev.latlng)

  const mapMove$ = MapDOM.chooseMap(`addEventMapAnchor`).select(`.addEventMap`).events(`moveend`)
    .do(() => {
      console.log(`mapMove`)
    })
    .map(getCenterZoom)
    .cache(1)

  console.log(`in location fgs`)
  const regionService = FactualGeotagService({props$: O.of({category: `region from location`}), latLng$: mapMove$.map(x => x.center), HTTP})
  const mapVicinity$ = regionService.result$
    .map(x => {
      console.log(`new rs result`)
      return x
    })
    .switchMap(region => {
      console.log(`region`)
      console.log(region)
      return mapMove$
        .map(position => ({region, position}))
        .do(x => {
          console.log(`internal mapMove$`)
        })
        .take(1)
    })
    .map(getVicinityFromMapLocation)


  const locationDescription$ = sources.DOM.select(`.appLocationDescription`).events(`input`)
    .map(ev => ev.target.value)

  const listing$ = Router.history$.take(1).map(x => x.state).cache(1)

  return {
    next$: sources.DOM.select(`.appNextButton`).events(`click`),
    back$: sources.DOM.select(`.appBackButton`).events(`click`),
    mapVicinity$,
    toHTTP$: regionService.HTTP,
    mapClick$,
    locationDescription$,
    vicinityScreen$: O.merge(showVicinityScreen$, hideVicinityScreen$),
    listing$
  }
}
