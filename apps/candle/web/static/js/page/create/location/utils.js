import {USAStateNamesToAbbr, getState} from '../../../util/states'
import {countryToAlpha2} from '../../../util/countryCodes'


export function getSearchAreaFromListing(listing) {
  return listing.profile.searchArea
}


export function getSearchAreaFromGeolocation(location) {
  const {position, region} = location
  return {
    center: position,
    region,
    radius: 50
  }
}

export function getSearchAreaFromMapLocation(location) {
  location.radius = 50
  return location
}


export function getSearchAreaString(searchArea) {
  const saRegion = searchArea.region
  if (saRegion.source === `ArcGIS`) {
    if (saRegion.type === `somewhere`) {
      const data = saRegion.data
      const {city, state, country, cityAbbr, stateAbbr, countryAbbr} = data
      if (city && state) return `${city}, ${stateAbbr || state}`
      else if (state && country) return `${state}, ${countryAbbr || country}`
      else if (country) return country
      else if (data.raw) return data.raw
      else return undefined
    } else {
      return `Nowhere`
    }
  } else { // Factual
    const data = saRegion.data
    const {country, region, locality} = data
    const state = getState(region)|| region
    const city = locality
    return `${city}, ${state}`
  }
}
