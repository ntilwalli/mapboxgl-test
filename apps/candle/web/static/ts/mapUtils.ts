export function createFeatureCollection(lngLat, properties?) {
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

export function geoToLngLat(x) {
  const {latitude, longitude} = x.data.coords
  return {lng: longitude, lat: latitude}
}

export function toLngLatArray(x) {
  if (x.lng && x.lat) {
    return [x.lng, x.lat]
  }

  throw new Error(`Invalid lng/lat object`)
}