function isString(pattern) {
  return typeof pattern === "string" || pattern instanceof String
}

export default function main(path, routes) {
  let matched = false
  for (let i = 0; i < routes.length; i++) {
    const {pattern, value} = routes[i]
    if (pattern instanceof RegExp) {
      const out = pattern.exec(path)
      if (out) {
        return {
          path: out[0],
          value: {
            match: out,
            info: value 
          }
        }
      }
    } else if (isString(pattern)) {
      if (path.search(pattern) >= 0) {
        return {
          path: pattern,
          value: {
            match: undefined,
            info: value
          }
        }
      }
    }
  }

  throw new Error(`No match for given path: ${path}`)
}