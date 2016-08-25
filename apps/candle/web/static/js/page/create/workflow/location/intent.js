import xs from 'xstream'
import combineObj from 'xs-combine-obj'
import dropRepeats from 'xstream/extra/dropRepeats'

import {getCenterZoom} from '../../../util/map'
import {targetIsOwner} from '../../../utils'
import FactualGeotagService from '../../../service/FactualGeotagService'
import {getVicinityFromMapLocation} from './utils'

export default function intent(sources) {
  const showVicinityScreen$ = sources.DOM.select(`.appChangeVicinityButton`).events(`click`)
    .mapTo(true)
  const hideVicinityScreen$ = xs.merge(
    sources.DOM.select(`.appModal`).events(`click`)
      .filter(targetIsOwner),
    sources.DOM.select(`.appModalClose`).events(`click`)
      .filter(targetIsOwner)
  ).mapTo(false)

  const mapClick$ = sources.MapDOM.chooseMap(`addEventMapAnchor`).select(`.addEventMap`).events(`click`)
     .map(ev => ev.latlng)

  const mapMove$ = sources.MapDOM.chooseMap(`addEventMapAnchor`).select(`.addEventMap`).events(`moveend`)
    .debug(() => {
      console.log(`mapMove`)
    })
    .map(getCenterZoom)
    .remember()

  console.log(`in location fgs`)
  const regionService = FactualGeotagService({props$: xs.of({category: `region from location`}), latLng$: mapMove$.map(x => x.center), HTTP: sources.HTTP})
  const mapVicinity$ = regionService.result$
    .map(x => {

      console.log(`new rs result`)
      return x
    })
    .map(region => {
      console.log(`region`)
      console.log(region)
      return mapMove$
        .map(position => ({region, position}))
        .debug(x => {
          console.log(`internal mapMove$`)
        })
        .take(1)
    })
    .flatten()
    .map(getVicinityFromMapLocation)


  const locationDescription$ = sources.DOM.select(`.appLocationDescription`).events(`input`)
    .map(ev => ev.target.value)


  return {
    next$: sources.DOM.select(`.appNextButton`).events(`click`),
    back$: sources.DOM.select(`.appBackButton`).events(`click`),
    mapVicinity$,
    toHTTP$: regionService.HTTP,
    mapClick$,
    locationDescription$,
    vicinityScreen$: xs.merge(showVicinityScreen$, hideVicinityScreen$)
  }
}
