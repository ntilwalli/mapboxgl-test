import moment = require('moment')

export function isThisListing(n, listing_result) {
  return n.item.object === listing_result.listing.id
}

export function notRead(listing_result) {
  return x => !x.read_at
}

function isListingVerb(val) {
  return ['create_listing', 'listing_create'].some(x => {
    return x === val
  })
}

export function isListingObject(n) {
  return n.item.verbs.some(isListingVerb)
}


export function inflate(n) {
  let {inserted_at, read_at, updated_at} = n
  if (inserted_at) {
    n.inserted_at = moment(inserted_at)
  }

  if (read_at) {
    n.read_at = moment(read_at)
  }

  if (updated_at) {
    n.updated_at = moment(updated_at)
  }

  inserted_at = n.item.inserted_at
  updated_at = n.item.updated_at

  if (inserted_at) {
    n.item.inserted_at = moment(inserted_at)
  }

  if (updated_at) {
    n.item.updated_at = moment(updated_at)
  }

  return n
}