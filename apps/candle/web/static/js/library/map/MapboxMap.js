import xs from 'xstream'
import combineObj from '../../combineObj'
import MarkerLayer from './MarkerLayer'
import VirtualDOM from 'virtual-dom'
import {noopListener, getCenterZoom} from '../../utils'

const VNode = VirtualDOM.VNode

function toMapDOM ({props, centerZoom, layers}) {

  let children = [
    new VNode(`tileLayer`, {
      tile: props.tile ? props.tile : `mapbox.streets`,
      options: {}
    })
  ]

  if (layers) children = children.concat(layers)

  const properties: Object = {attributes: {class: `mainMap`}, centerZoom: centerZoom, anchorId: props.anchorId}
  if (props.maxBounds) properties[`maxBounds`] = props.maxBounds
  if (props.disablePanZoom) properties[`disablePanZoom`] = props.disablePanZoom

  let out = new VNode(`map`, properties, children)
  return out
}

function MapboxMap (sources) {
  const {
    props$,
    centerZoom$,
    markerLayers$$,
    highlighted$,
    MapDOM
  } = sources

  const move$ = MapDOM.select(`.mainMap`).events(`moveend`)
  const mergedCenterZoom$ = xs.merge(centerZoom$, move$.map(getCenterZoom))
    .remember()

  const markerLayers$ = markerLayers$$
    .map((markerLayers$): any => {

      const components = markerLayers$
        .map(markerLayer => MarkerLayer({
          props$: markerLayer.props$,
          markers$: markerLayer.markers$,
          highlighted$,//: sHighlighted$,
          MapDOM
        }))

      let mapDOMs = components.map(c => c.MapDOM)
      let clicks = components.map(c => c.click$)
      let retval

      if (mapDOMs.length === 0) {
        return {
          MapDOM: xs.of([]),
          click$: xs.never()
        }
      } else {
        return {
          MapDOM: xs.combine(mapDOMs),
          click$: xs.merge(clicks)
        }
      }
    })
    .remember()

  return {
    MapDOM: combineObj({
      props$,
      centerZoom$: mergedCenterZoom$,
      layers$: markerLayers$.flatMapLatest(x => x.MapDOM)
    }).map(toMapDOM),
    click$: markerLayers$.map(x => x.click$).flatten(),
    centerZoom$: mergedCenterZoom$
  }
}

export default MapboxMap
