import {USAStateNamesToAbbr, getState} from '../../../../util/states'

export function getVicinityFromListing(listing, userLocation) {
  if (listing && listing.location && listing.location.vicinity) {
    return listing.location.vicinity
  } else {
    if (userLocation && userLocation.region) {
      return getVicinityFromUserLocation(userLocation)
    }
  }
}

export function getRegionFromLocation (location) {
  let region
  if (location.region.type === `somewhere`) {
    const r = location.region.data
    region = {
      type: `somewhere`,
      data: {
        state: getState(r.region)|| r.region,
        city: r.locality,
        country: r.country
      }
    }
  } else {
    region = {
      type: `nowhere`
    }
  }

  return region
}


export function getVicinityFromUserLocation(location) {
  return {
    region: getRegionFromLocation(location),
    position: {
      center: location.position,
      zoom: 8
    }
  }
}

export function getVicinityFromMapLocation(location) {
  return {
    region: getRegionFromLocation(location),
    position: location.position
  }
}


export function getVicinityString(vicinity) {
  const region = vicinity.region
  if (region.type === `somewhere`) {
    const data = region.data
    const {city, state, country, cityAbbr, stateAbbr, countryAbbr} = data
    if (city && state) return `${city}, ${stateAbbr || state}`
    else if (state && country) return `${state}, ${countryAbbr || country}`
    else if (country) return country
    else if (data.raw) return data.raw
    else return undefined
  } else {
    return `Nowhere`
  }
}
