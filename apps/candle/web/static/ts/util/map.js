export function getCenterZoom(ev) {
  //console.log(`getting centerZoom...`)
  let map = ev.target
  //console.log(map.getCenter)
  const newCenter = map.getCenter()

  let centerZoom = {
    zoom: map.getZoom(),
    center: newCenter
  }

  return centerZoom
}


export function toLngLatArray(obj) {
  if (obj.hasOwnProperty(`lat`) && obj.hasOwnProperty(`lng`)) return [obj.lng, obj.lat]

  throw new Error(`Invalid latLng object given`)
}

export function createFeatureCollection(lngLat, properties) {
  return {
      type: "FeatureCollection",
      features: [{
          type: "Feature",
          geometry: {
              type: "Point",
              coordinates: [lngLat.lng, lngLat.lat]
          },
          properties
      }]
  }
}