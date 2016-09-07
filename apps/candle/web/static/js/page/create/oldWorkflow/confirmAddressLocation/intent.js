import xs from 'xstream'
import combineObj from 'xs-combine-obj'
import dropRepeats from 'xstream/extra/dropRepeats'

import {getCenterZoom} from '../../../util/map'

export default function intent(sources) {
  const mapClick$ = sources.MapDOM.chooseMap(`modifyLocationMapAnchor`).select(`.modifyLocationMap`).events(`click`)
     .map(ev => ev.latlng)

  const mapMove$ = sources.MapDOM.chooseMap(`modifyLocationMapAnchor`).select(`.modifyLocationMap`).events(`moveend`)
    .debug(() => {
      console.log(`mapMove`)
    })
    .map(getCenterZoom)
    .remember()

  return {
    next$: sources.DOM.select(`.appNextButton`).events(`click`),
    back$: sources.DOM.select(`.appBackButton`).events(`click`),
    mapClick$,
    mapMove$//,
    //dragMarker$
  }
}
