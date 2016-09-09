import VirtualDOM from 'virtual-dom'
const VNode = VirtualDOM.VNode

function toLatLngArray(center) {
  return [center.lat, center.lng]
}

function renderMapMode(listing) {
  const location = listing.profile.location
  const anchorId = `addEventMapAnchor`
  const centerZoom = location.info ? {center: toLatLngArray(location.info.latLng), zoom: 15} : {center: toLatLngArray(location.vicinity.position.center), zoom: 15}
  const properties = {attributes: {class: `addEventMap`}, centerZoom, disablePanZoom: false, anchorId, mapOptions: {zoomControl: true}}
  const tile = listing.mapSettings ? state.mapSettings.tile : `mapbox.streets`

  return new VNode(`map`, properties, [
    new VNode(`tileLayer`, { tile }),
    location.info ? new VNode(`marker`, { latLng: centerZoom.center, attributes: {id: `latLngMarker`}}, [
            // new VNode(`divIcon`, {
            //   options: {
            //     iconSize: 80,
            //     iconAnchor: [40, -10],
            //     html: `${event.core.name}`
            //   },
            //   attributes: {id: divIconId}
            // }, [], divIconId)
          ],
          `latLngMarker`) : null
  ])

}

function renderVenueModeFoursquare(listing) {
  const location = listing.location
  const anchorId = `addEventMapAnchor`

  const centerZoom = {
    center: location.info.data.latLng,
    zoom: 15
  }


  const properties = {attributes: {class: `addEventMap`}, centerZoom, disablePanZoom: false, anchorId, mapOptions: {zoomControl: true}}
  const tile = listing.mapSettings ? state.mapSettings.tile : `mapbox.streets`


  return new VNode(`map`, properties, [
    new VNode(`tileLayer`, { tile }),
    new VNode(`marker`, { latLng: centerZoom.center, attributes: {id: `latLngMarker`}}, [
            // new VNode(`divIcon`, {
            //   options: {
            //     iconSize: 80,
            //     iconAnchor: [40, -10],
            //     html: `${event.core.name}`
            //   },
            //   attributes: {id: divIconId}
            // }, [], divIconId)
          ],
          `latLngMarker`)
  ])
}

export default function view(state$) {
  return state$
    .map(state => {
      const listing = state.listing
      const location = listing.profile.location

      if (location.mode === `map`) {
        return renderMapMode(listing)
      } else if (location.mode === `venue` && location.info) {
        return renderVenueModeFoursquare(listing)
      } else {
        return null
      }
    })
    .filter(x => !!x)
}
