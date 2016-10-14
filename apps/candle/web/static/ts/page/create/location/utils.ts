import {USAStateNamesToAbbr, getState} from '../../../util/states'
import {countryToAlpha2} from '../../../util/countryCodes'
import {getVicinityFromGeolocation} from '../../../utils'


export function getSearchAreaFromListing(listing) {
  return listing.profile.searchArea
}


export function getSearchAreaFromGeolocation(location) {
  const vicinity = getVicinityFromGeolocation(location)
  return {
    center: vicinity.position,
    region: vicinity.region,
    radius: 50
  }
}

export function getSearchAreaString(searchArea) {
  const saRegion = searchArea.region
  const {source} = saRegion
  if (source === `arcgis`) {
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
  } else if (source === `factual`) {
    if (saRegion.type === `somewhere`) {
      const data = saRegion.data
      const {country, region, locality} = data
      const state = getState(region)|| region
      const city = locality
      return `${city}, ${state}`
    } else {
      return `Nowhere`
    }
  } else if (source === `manual`) {
    const data = saRegion.data
    const {country, region, locality} = data
    const state = region // equivalent of state as per geolocation region default
    const city = locality
    return `${city}, ${state}`
  } 

  throw new Error(`Invalid region source`)
}
