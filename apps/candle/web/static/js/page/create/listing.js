export function getEmptyListing() {
  return {
    id: undefined,
    parentId: undefined,
    type: `single`,
    insertedAt: undefined,
    updatedAt: undefined,
    profile: {
      meta: {
        eventType: undefined,
        visibility: undefined
      },
      description: {
        title: undefined,
        description: undefined,
        shortDescription: undefined,
        categories: []
      },
      where: {
        mode: `venue`,
        vicinity: undefined,
        info: undefined,
        mapSettings: {
          center: undefined,
          zoom: undefined,
          viewport: undefined
        }
      }
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
function length(val) {
  return {type: `length`, data: val}
}

export function getValidators(step, listing) {
  const {type, profile} = listing
  const profileDescription = profile.description
  const profileMeta = profile.meta
  const {visibility, eventType} = profileMeta
  const {title, description, categories} = profileDescription
  if (step === "listing") {
    return {
      type: [required]
    }
  }
  else if (step === `meta`) {
    if (type !== `group`) {
      return {
        visibility: [required],
        eventType: [required]
      }
    } else {
      return {
        visibility: [required],
        eventType: [disabled]
      }
    }
  } else if (step === `description`) {
    if (eventType === `show` || eventType === `gathering`) {
      return {
        title: [required],
        description: [required],
        shortDescription: [optional],
        categories: [length()]
      }
    } else {
      return {
        title: [required],
        description: [optional],
        shortDescription: [disabled],
        categories: [disabled]
      }
    }
  }
}

export function isDisabled(section, property, listing) {
  const validators = getValidators(section, listing)
  const validator = validators[property]
  return validator.some(x => x.type === `disabled`)
}

export function isOptional(section, property, listing) {
  const validators = getValidators(section, listing)
  const validator = validators[property]
  return validator.some(x => x.type === `optional`)
}

export function validate(validators, obj) {
  for (let key in validators) {
    if (validators.hasOwnProperty(key)) {
      const vals = validators[key]
      const len = vals.length
      for (let i = 0; i < len; i++) {
        const v = vals[i]
        const prop = obj[key]
        switch (v.type) {
          case `required`:
            if (!prop || !prop.length) {
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
    }
  }
  
  return true
}

export function validateMeta(listing) {
  const {profile} = listing
  const {meta} = profile
  const metaValidators = getValidators(`meta`, listing)
  const listingValidators = getValidators(`listing`, listing)
  return validate(metaValidators, meta) && validate(listingValidators, listing)
}

export function validateDescription(listing) {
  const {profile} = listing
  const profileDescription = profile.description
  const validators = getValidators(`description`, listing)
  return validate(validators, profileDescription)
}