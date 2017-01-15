import {Observable as O, Subject, ReplaySubject} from 'rxjs'
import {nav, hr, div, a, input, form, strong, span, button} from '@cycle/dom'
import {getState} from './states'
import {geoToLngLat} from './mapUtils'
import moment = require('moment')
import clone = require('clone')

export function capitalize(val) {
  return val.substring(0, 1).toUpperCase() + val.substring(1)
}

export function toMoment(c) { return moment(c.toISOString()) }
export function inflateListing(listing) {
  const {cuando, meta} = listing
  const {begins, ends} = cuando

  if (begins) {
    const inflated_begins = moment(begins)
    listing.cuando.begins = inflated_begins
  }

  if (ends) {
    listing.cuando.ends = moment(ends)
  }

  return listing
}


export function spread(...arr) {
  return (<any> Object).assign({}, ...arr)
}

interface ProxyObservable<T> extends O<T> {
  attach: (Observable) => void
}

export function createProxy(type = 'regular'): ProxyObservable<any> {
  let start_up_token = "start up token"
  let upstream
  let rand
  let sub
  let active 
  const source = type === 'replay' ? new ReplaySubject(1) : new Subject()
  const proxy = source
    .startWith(start_up_token)
    .do(x => {
      if (x === start_up_token) {
        // This enables restart
        if (upstream && !active) {
          sub = upstream.subscribe(source)
        }
      }
    })
    .filter(x => x !== start_up_token)
    .finally(() => {
      if (sub) {
        sub.unsubscribe()
        sub = undefined
        active = false
      }
    }).publish().refCount()

  ;(<ProxyObservable<any>> proxy).attach = (stream) => {
    rand = Math.random()
    upstream = stream
    active = true  // This must be set before subscribe so double subscription does not happen
    sub = upstream.subscribe(source)
  }

  return <ProxyObservable<any>> proxy
}

export function isInteger(x) {
  return x % 1 === 0;
}

export function targetIsOwner(ev) {
  return ev.target === ev.ownerTarget
}

export function noop() {}

export function defaultNever(component, sinkName) {
  const out = component[sinkName] || O.never()
  return out.publish().refCount()
}

export function defaultUndefined(component, sinkName) {
  return component[sinkName] || O.of(undefined)
}

export function blankComponent() {
  return {
    DOM: O.never(),
    MapJSON: O.never(),
    Router: O.never(),
    Global: O.never(),
    Storage: O.never(),
    HTTP: O.never(),
    //Heartbeat: O.never(),
    message$: O.never()
  }
}

export function blankComponentUndefinedDOM() {
  return {
    DOM: O.of(undefined),
    MapJSON: O.never(),
    Router: O.never(),
    Global: O.never(),
    Storage: O.never(),
    HTTP: O.never(),
    //Heartbeat: O.never(),
    message$: O.never()
  }
}

function mergeSelective(...sinks) {
  const len = sinks.length
  if (len) {
    if (len === 1) {
      return sinks[0]
    } else {
      return O.merge(...sinks)
    }
  } else {
    return O.never()
  }
}

export function mergeSinks(...components) {
  const MapJSON = mergeSelective(...components.map(c => c.MapJSON).filter(x => !!x)).publish().refCount()
  const HTTP = mergeSelective(...components.map(c => c.HTTP).filter(x => !!x)).publish().refCount()
  const Router = mergeSelective(...components.map(c => c.Router).filter(x => !!x)).publish().refCount()
  const Global = mergeSelective(...components.map(c => c.Global).filter(x => !!x)).publish().refCount()
  const Storage = mergeSelective(...components.map(c => c.Storage).filter(x => !!x)).publish().refCount()
  //const Heartbeat = mergeSelective(...components.map(c => c.Heartbeat).filter(x => !!x)).publish().refCount()
  const Phoenix = mergeSelective(...components.map(c => c.Phoenix).filter(x => !!x)).publish().refCount()
  const MessageBus = mergeSelective(...components.map(c => c.MessageBus).filter(x => !!x)).publish().refCount()
  return {
    MapJSON, HTTP, Router, Global, Storage, MessageBus, Phoenix
  }
}

export function normalizeComponent(component) {
  return {
    ...component, 
    DOM: defaultNever(component, `DOM`).publish().refCount(),
    MapJSON: defaultNever(component, 'MapJSON').publish().refCount(),
    Router: defaultNever(component, `Router`).publish().refCount(),
    Global: defaultNever(component, `Global`).publish().refCount(),
    Storage: defaultNever(component, `Storage`).publish().refCount(),
    HTTP: defaultNever(component, `HTTP`).publish().refCount(),
    Phoenix: defaultNever(component, 'Phoenix').publish().refCount(),
    // Heartbeat: defaultNever(component, `Heartbeat`).publish().refCount(),
    MessageBus: defaultNever(component, `MessageBus`).publish().refCount()
  }
}

export function componentify(component$) {
  return {
    DOM: normalizeSink(component$, `DOM`).publish().refCount(),
    MapJSON: normalizeSink(component$, `MapJSON`).publish().refCount(),
    Router: normalizeSink(component$, `Router`).publish().refCount(),
    Global: normalizeSink(component$, `Global`).publish().refCount(),
    Storage: normalizeSink(component$, `Storage`).publish().refCount(),
    HTTP: normalizeSink(component$, `HTTP`).publish().refCount(),
    Phoenix: normalizeSink(component$, 'Phoenix').publish().refCount(),
    //Heartbeat: normalizeSink(component$, `Heartbeat`).publish().refCount(),
    MessageBus: normalizeSink(component$, `MessageBus`).publish().refCount(),
  }
}

export function normalizeSink(component$, sinkName) {
  return component$
    .switchMap(x => {
      return x[sinkName] || O.never()
    })
}

export function normalizeSinkUndefined(component$, sinkName) {
  return component$
    .switchMap(x => {
      return x[sinkName] || O.of(undefined)
    })
}

export function combineObj(obj) {
  const sources = [];
  const keys = [];
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key.replace(/\$$/, ''));
      sources.push(obj[key]);
    }
  }

  function toObj() {
    const argsLength = arguments.length;

    const combination = {};
    for (let i = argsLength - 1; i >= 0; i--) {
      combination[keys[i]] = arguments[i];
    }
    return combination;
  }

  return O.combineLatest(...sources, toObj)
    .map(x => {
      return x
    })
}

/**
 * source: --a--b----c----d---e-f--g----h---i--j-----
 * first:  -------F------------------F---------------
 * second: -----------------S-----------------S------
 *                         between
 * output: ----------c----d-------------h---i--------
 */
export function between(first, second) {
  return (source) => first.switchMap(() => {
    return source.takeUntil(second)
  })
}

/**
 * source: --a--b----c----d---e-f--g----h---i--j-----
 * first:  -------F------------------F---------------
 * second: -----------------S-----------------S------
 *                       notBetween
 * output: --a--b-------------e-f--g-----------j-----
 */
export function notBetween(first, second) {
  return source => O.merge(
    source.takeUntil(first),
    first.switchMap(() => source.skipUntil(second))
  )
}

export function traceStartStop(id = '') {
  return source => source
    .startWith(`start`)
    .map(x => {
      if (x === `start`) {
        console.log(`starting ${id}`)
      }
      return x
    })
    .filter(x => x !== `start`)
    .finally(x => console.log(`ending ${id}`))
}

export const checkValidity = x => x.valid ? x.value : null

export function processHTTP(sources, category) {
  const {HTTP} = sources

  const out$ = HTTP.select(category)
    .switchMap(res$ => res$
      .map(res => {
        //console.log(res)
        if (res.statusCode === 200) {
          return {
            type: "good",
            data: res.body
          }
        } else {
          return {
            type: `bad`,
            data: `Unsuccessful response from server`
          }
        }
      })
      .catch((e, orig$) => {
        return O.of({type: `ugly`, data: e.message})
      })
    ).publish().refCount()

  const good$ = out$.filter(x => x.type === "good").map(x => x.data).publish().refCount()
  
  return {
    good$,
    bad$: out$.filter(x => x.type === "bad").map(x => x.data).publish().refCount(),
    ugly$: out$.filter(x => x.type === "ugly").map(x => x.data).publish().refCount(),
    success$: good$.filter(onlySuccess)
      //.do(x => console.log(`good$`, x))
      .pluck(`data`)
      .publish().refCount(),
    error$: good$.filter(onlyError)
      //.do(x => console.log(`error$`, x))
      .pluck(`data`)
      .publish().refCount()
  }

}

export function clean (val) {
  if (typeof val === 'string') {
    return val.replace(/town of,?/i, '')
  }
}

export const onlySuccess = x => x.type === "success"
export const onlyError = x => x.type === "error"

function cleanCityName(x) {
  if (x.toUpperCase() === "New York City".toUpperCase()) {
    return "New York"
  }

  return x
}

export const normalizeArcGISSingleLineToString = x => {
  const tokens = x.split(',')
  return `${cleanCityName(tokens[0].trim())}, ${getState(tokens[1].trim())}`
}

export const normalizeArcGISSingleLineToParts = x => {
  const tokens = x.split(',')
  return {city: cleanCityName(tokens[0].trim()), state_abbr: getState(tokens[1].trim())}
}

export function getPreferredRegion$(inputs) {
  return combineObj({
    settings$: inputs.settings$,
    geoinfo$: inputs.Geolocation.cachedGeolocationWithGeotagAndCityState$
  }).map((info: any) => {
    const {settings, geoinfo} = info
    const {use_region} = settings
    const {geolocation, city_state} = geoinfo
    if (use_region === `user` && geolocation.type === `position`) {
      return {
        position: geoToLngLat(geolocation),
        city_state
      }
    } else {
      return clone(settings.default_region)
    }
  })
}
  