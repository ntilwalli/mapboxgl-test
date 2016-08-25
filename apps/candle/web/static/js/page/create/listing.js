export function getEmptyListing() {
  return {
    id: undefined,
    lastUpdated: undefined,
    meta: {
      creationType: `single`,
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
  const {meta} = listing
  const listingDescription = listing.description
  const {creationType, visibility, eventType} = meta
  const {title, description, categories} = listingDescription
  if (step === `meta`) {
    if (!creationType || creationType !== `group`) {
      return {
        creationType: [required],
        visibility: [required],
        eventType: [required]
      }
    } else {
      return {
        creationType: [required],
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
  const {meta} = listing
  const validators = getValidators(`meta`, listing)
  return validate(validators, meta)
}

export function validateDescription(listing) {
  const {description} = listing
  const validators = getValidators(`description`, listing)
  return validate(validators, description)
}