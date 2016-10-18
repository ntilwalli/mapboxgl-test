export function inflate(session) {
  const {listing, updated_at, inserted_at  } = session
  const {type, profile} = listing
  const {time} = profile
  if (updated_at) {
    listing.updated_at = typeof updated_at === `string` ? new Date(updated_at) : updated_at
  }

  if (inserted_at) {
    listing.inserted_at = typeof inserted_at === `string` ? new Date(inserted_at) : inserted_at
  }

  if (time) {
    if (type === `recurring`) {
      const {rrule} = time
      const {dtstart, until} = rrule
      rrule.dtstart = typeof dtstart === `string` ? new Date(dtstart) : dtstart
      rrule.until = typeof until === `string` ? new Date(until) : until
    } else if (type === `single`) {
      const {start, end} = time
      if (start && start.type === `datetime`) {
        time.start.data = typeof start.data === `string` ? new Date(start.data) : start.data
      }

      if (end && end.type === `datetime`) {
        time.end.data = typeof end.data === `string` ? new Date(end.data) : end.data
      }
    }
  }

  //console.log(`inflated listing:`, listing)
  return session

}

export function getEmptySession() {
  return {
    id: undefined,
    search_area: undefined,
    listing: getEmptySessionListing(),
    inserted_at: undefined,
    updated_at: undefined
  }
}

export function getEmptySessionListing() {
  return {
    id: undefined,
    parentId: undefined,
    type: `single`,
    visibility: `private`,
    profile: {
      event_types: undefined,
      title: undefined,
      description: undefined,
      short_description: undefined,
      categories: [],
      location: {
        mode: `venue`,
        info: undefined
      },
      // {
      //   center: undefined,
      //   region: undefined,
      //   radius: undefined
      // },
      map_settings: undefined,
      // {
      //   center: undefined,
      //   zoom: undefined,
      //   viewport: undefined
      // },
      time: undefined
      // {
      //   start: undefined,
      //   end: undefined,
      //   rrule: undefined
      //   rruleSet: undefined
      // }
    }
    // {
    //   mode: undefined,
    //   selected: undefined
    // }
  }
}

const required = {type: `required`}
const optional = {type: `optional`}
const disabled = {type: `disabled`}
function length(val?) {
  return {
    type: `length`, 
    data: val
  }
}

function tree(val) {
  return {
    type: `tree`,
    data: val
  }
}


// export function getValidators(step, listing): any {
//   const {type, profile, visibility} = listing
//   const profileDescription = profile.description
//   const profileMeta = profile.meta
//   const {event_type} = profileMeta
//   const {title, description, categories} = profileDescription
//   const {mode} = profile.location
//   if (step === "listing") {
//     return {
//       type: [required]
//     }
//   } else if (step === "time") {
//     if (type === `single`) {
//       return {
//         start: [required],
//         end: [optional]
//       }
//     } else {
//       throw new Error(`Invalid event_type for time step`)
//     }
//   } else if (step === `location`) {
//     if (mode === `address`) {
//       return {
//         street: [required],
//         city: [required],
//         stateAbbr: [required],
//         zipCode: [required],
//         aptSuiteBldg: [optional],
//         countryCode: [required],
//         latLng: [required],
//         description: [optional]
//       }
//     } else if (mode === `map`) {
//       return {
//         latLng: [required],
//         description: [optional]
//       }
//     } else if (mode === `venue`) {
//       return {
//         source: [required],
//         data: [required],
//         type: [optional]
//       }
//     }
//   } else if (step === `meta`) {
//     if (type !== `group`) {
//       return {
//         visibility: [required],
//         event_type: [required]
//       }
//     } else {
//       return {
//         visibility: [required],
//         event_type: [disabled]
//       }
//     }
//   } else if (step === `description`) {
//     if (event_type === `show`) {
//       return {
//         title: [required],
//         description: [required],
//         short_description: [optional],
//         categories: [length()]
//       }
//     } else if (event_type === `gathering`) {
//       return {
//         title: [required],
//         description: [required],
//         short_description: [optional],
//         categories: [optional]
//       }
//     } else {
//       return {
//         title: [required],
//         description: [optional],
//         short_description: [disabled],
//         categories: [disabled]
//       }
//     }
//   }
// }



function isEventType(listing, type) {
  const event_types = listing.profile.event_types
  if (event_types && Array.isArray(event_types)) {
    return event_types.some(x => x === type)
  }

  throw new Error("event_types must be an array")
}

export function getValidators(step, listing): any {

  switch (step) {
    case "meta":
      return {
        type: [required],
        visibility: [required],
        profile: {
          event_types: [length()]
        }
      }
    case "description":
      if (isEventType(listing, `show`)) {
        return {
          profile: {
            title: [required],
            description: [required],
            short_description: [optional],
            categories: [length()]
          }
        }
      } else if (isEventType(listing, `gathering`)) {
        return {
          profile: {
            title: [required],
            description: [required],
            short_description: [optional],
            categories: [optional]
          }
        }
      } else {
        return {
          profile: {
            title: [required],
            description: [optional],
            short_description: [disabled],
            categories: [disabled]
          }
        }
      }
    default:
      break

  }

  throw new Error('Invalid step given')
}

function validateString(section, property) {
  if (!(typeof section === 'string' && typeof property === 'string')) {
    throw new Error("section and property attributes must by strings")
  }
}

function applyObjectKeysArray(obj, arr, index=0) {
  if (arr.length === 0) return obj
  
  const val = obj[arr[index]]
  if (val) {
    if (arr.length - 1 === index) {
      return val
    } 
  } else {
    throw new Error(`Invalid property key given`)
  }

  return applyObjectKeysArray(val, arr, index+1)
}

export function isDisabled(section, property, listing) {
  validateString(section, property)

  const validators = getValidators(section, listing)
  const tokens = property.split('/').filter(x => x.length > 0)
  const validator = applyObjectKeysArray(validators, tokens)
  return validator.some(x => x.type === `disabled`)
}

export function isOptional(section, property, listing) {
  validateString(section, property)
  const validators = getValidators(section, listing)
  const tokens = property.split('/').filter(x => x.length > 0)
  const validator = applyObjectKeysArray(validators, tokens)
  return validator.some(x => x.type === `optional`)
}

export function validate(validators, obj) {
  if (!obj) return false

  for (let key in validators) {
    if (validators.hasOwnProperty(key)) {
      const validator = validators[key]
      if (Array.isArray(validator)) {
        const len = validator.length
        for (let i = 0; i < len; i++) {
          const v = validator[i]
          const prop = obj[key]
          switch (v.type) {
            case `required`:
              if (!prop || (Array.isArray(prop) && !prop.length)) {
                return false
              }
              break
            case `disabled`:
              if (prop && (!Array.isArray(prop) || prop.length > 0)) {
                return false
              }
              break
            case `length`:
              if (!prop || !Array.isArray(prop) || !prop.length) {
                return false
              }
              if (v.data && prop.length < v.data) {
                return false
              }
              break
            default:
              break
          }
        }
      } else {
        const nestedValue = obj[key]
        if (typeof validator === 'object' && typeof nestedValue === 'object') {
          return validate(validator, nestedValue)
        } else {
          return false
        }
      }
    }
  }
  
  return true
} 

export function validateMeta(listing) {
  const validators = getValidators(`meta`, listing)
  return validate(validators, listing)
}

export function validateDescription(listing) {
  const validators = getValidators(`description`, listing)
  return validate(validators, listing)
}

export function validateLocation(listing) {
  const {profile} = listing
  const {location} = profile
  const validators = getValidators(`location`, listing)
  return validate(validators, location.info)
}

export function validateTime(listing) {
  const {profile} = listing
  const {time} = profile
  const validators = getValidators(`time`, listing)
  return validate(validators, time)
}