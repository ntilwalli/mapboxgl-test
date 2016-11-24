export function getVenueAddress(venue) {

    const {source, data} = venue
    if (source === `foursquare`) {
     return [data.location.address, data.location.state, data.location.postalCode].join(`, `)
    }

  throw new Error(`Invalid type`)
}

export function getVenueName(venue) {
    const {source, data} = venue
    if (source === `foursquare`) {
     return data.name
    }


  throw new Error(`Invalid type`)
}

export function getVenueLngLat(venue) {

    const {source, data} = venue
    if (source === `foursquare`) {
     return {lat: data.location.lat, lng: data.location.lng}
    }

  throw new Error(`Invalid type`)
}