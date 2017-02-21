export function isValid(venue) {
  const {source, data} = venue
  if (source === `foursquare`) {
    const {address, state, postalCode} = data.location
    return address && state && postalCode
  }

  throw new Error(`Invalid source`)
}

export function getDondeName(donde) {
  const {type} = donde
  if (type === `venue`) {
    return getVenueName(donde)
  } else if (type === 'badslava') {
    return getBadslavaName(donde)
  }


  throw new Error(`Invalid type`)
}

export function getDondeAddress(donde) {
  const {type} = donde
  if (type === `venue`) {
    return getVenueAddress(donde)
  } else if (type === 'badslava') {
    return getBadslavaAddress(donde)
  }


  throw new Error(`Invalid type`)
}

export function getDondeLngLat(donde) {
  return donde.lng_lat
}

export function getBadslavaName(donde) {
  return donde.name
}


export function getBadslavaAddress(donde) {
  return donde.street + ', ' + donde.city
}


export function getVenueAddress(venue) {

  const {source, data} = venue
  if (source === `foursquare`) {
    
    if (isValid(venue)) {
      let {address, state, postalCode} = data.location
      if (address.indexOf(postalCode) >= 0) {
        address = address
          .split(",")
          .filter(x => x.length)
          .map(x => x.trim())[0]
      }

      return [address.trim(), state.trim(), postalCode.trim()].join(`, `)
        .replace(/\(.*\)/, '')
        .replace(/street/i, `St`)
        .replace(/avenue/i, `Ave`)
    }

    throw new Error(`Invalid venue`)
  }

  throw new Error(`Invalid source`)
}



export function getVenueName(venue) {
    const {source, data} = venue
    if (source === `foursquare`) {
     return data.name
    }


  throw new Error(`Invalid source`)
}

export function getVenueLngLat(venue) {

    const {source, data} = venue
    if (source === `foursquare`) {
     return {lat: data.location.lat, lng: data.location.lng}
    }

  throw new Error(`Invalid source`)
}