import combineObj from '../../combineObj'
//import {LatLng} from '../../../message/common'
//import Marker from './Marker'
import VirtualDOM from 'virtual-dom'
import {noopListener} from '../../utils'
import xs from 'xstream'
import dropRepeates from 'xstream/extra/dropRepeats'
import Immutable = require('immutable')

const VNode = VirtualDOM.VNode

function appendPeriod (className) {
  if(className.charAt(0) !== '.')
    return `.${className}`
  else
    return className
}

function featureGroup (className, children) {
  return new VNode(`featureGroup`, {attributes: {class: className}}, children)
}

function intent (props$, MapDOM) {
  const hover$ =
      props$
        .filter(p => !!p.enableHover)
        .map(props => {
          const selectedLayer = MapDOM.select(appendPeriod(props.className))
          return xs.merge(
            selectedLayer.events(`mouseover`),
            selectedLayer.events(`mouseout`).map(x => undefined)
          )
        })
        .flatten()

  const click$ =
    props$
      .filter(props => !!props.enableClick)
      .map(props => {
        return MapDOM.select(appendPeriod(props.className)).events('click')
          .filter(ev => !!ev.layer.mapdomInfo)
          .map(ev => ev.layer.mapdomInfo)
      })
      .flatten()

  return {
    hover$,
    click$
  }
}

function reducers (highlighted$, actions) {
  const setHighlightedReducer$ = xs.merge(
    actions.hover$.map(ev => (ev && ev.layer && ev.layer.mapdomInfo) ? ev.layer.mapdomInfo.get(`id`) : null),
    highlighted$.compose(dropRepeats())
  )
  .map(id => function (state) {
    //console.log(`setting highlighted: ${id}`)
    return state.set(`highlighted`, id)
  })

  return setHighlightedReducer$
}

function model (results$, highlighted$, actions) {
  const mod$ = reducers(highlighted$, actions)
  const state$ = results$
    .startWith([])
    .map(x => Immutable.Map({
      highlighted: null,
      results: x
    }))
    .map(state => mod$.fold((acc, mod: Function) => mod(acc), state))
    .flatten()
    .remember()

  return state$
}

function view (props$, state$) {
  return props$
    //.do(x=> console.log(`new layer props`))
    .map(props => {
      const className = props.className || `defaultLayerClass`
      const markerRenderer = props.markerRenderer
      const hoverRenderer = props.enableHover && props.hoverRenderer
      const clickRenderer = props.enableClick && props.clickRenderer
      const idRetriever = props.idRetriever

      return state$
        //.do(x => console.log(`new map state`))
        .map(state => {
          const results = state.get(`results`)
          //console.log(`results`)
          //console.log(results)
          const highlighted = state.get(`highlighted`)
          const clicked = state.get(`clicked`)
          const children = results.reduce((acc, result) => {
            // console.log(`map result`)
            // console.log(result)
            // enrich result with metadata
            const renderedMarker = markerRenderer(result)
            const renderedHover =  (hoverRenderer && highlighted === idRetriever(result)) ? hoverRenderer(result) : null
            const renderedClick = (clickRenderer && clicked && clicked === idRetriever(result)) ? clickRenderer(result) : null

            renderedMarker.properties.info = Immutable.Map({type: result.type, id: idRetriever(result)})

            return acc.concat([
              renderedMarker,
              renderedHover,
              renderedClick
            ])
          }, [])

          const filteredChildren = children.filter(x => x)
          const out = featureGroup(className, filteredChildren)
          return out
        })
        .flatten()
    })
}

function MarkerLayer (sources) {
  const {
    props$,
    markers$,
    highlighted$,
    MapDOM
  } = sources

  const sharedProps$ = props$.remember()

  const sMarkers$ = markers$

  const actions = intent(sharedProps$, MapDOM)
  const state$ = model(sMarkers$, highlighted$, actions)
  const mtree$ = view(props$, state$)

  return {
    MapDOM: mtree$,
      //.do(x => console.log(`markerLayerOutput`)),
    hover$: actions.hover$,
    click$: actions.click$
  }

}

export default MarkerLayer
