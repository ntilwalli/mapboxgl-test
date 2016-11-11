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