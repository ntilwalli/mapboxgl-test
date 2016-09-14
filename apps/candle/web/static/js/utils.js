import {Observable as O, Subject, ReplaySubject} from 'rxjs'
import {nav, hr, div, a, input, form, strong, span, button} from '@cycle/dom'

export function spread(...arr) {
  return Object.assign({}, ...arr)
}

export function createProxy() {
  let sub
  const source = new Subject()
  const proxy = source.finally(() => {
    if (sub) {
      sub.unsubscribe()
    }
  }).publish().refCount()

  proxy.attach = (stream) => {
    sub = stream.subscribe(source)
  }

  return proxy
}

export function attrs (val, monoProps) {
  if (monoProps) {
    if (monoProps.some(x => x === `checked`)) {
      val.checked = `checked`
    }

    if (monoProps.some(x => x === `disabled`)) {
      val.disabled = `disabled`
    }

    if (monoProps.some(x => x === `hidden`)) {
      val.hidden = `hidden`
    }
  }

  return {attrs: val}
}

export function targetIsOwner(ev) {
  return ev.target === ev.ownerTarget
}

export function toLatLngArray(center) {
  return [center.lat, center.lng]
}

export function noop() {}

export function renderTextPasswordField(type, name, cssClass, placeholder, value) {
  return div(`.form-group`, [
    input(`${cssClass}.form-control`, attrs({type, placeholder, name, value: value ? value : ``}))
  ])
}

export function renderOrSeparator() {
  return div(`.signup-or-separator`, [
    span(`.h6.signup-or-separator--text`, [`or`]),
    hr()
  ])
}

export function renderExternalButton(text, cssClass) {
  const c = cssClass ? cssClass : ``
  return div(`.form-group`, [
    button(`${c}.btn.btn-block.btn-primary`, [text])
  ])
}

export function renderExternalLink(text, cssClass) {
  const c = cssClass ? cssClass : ``
  return button(`${c}.btn.btn-link.external-link`, [text])
}

export function renderAlerts(state) {
  return div(`.form-group`, [
    div(`alerts-area`, state.errors.map(err => div(`.input-error`, [err])))
  ])
}

export function defaultNever(component, sinkName) {
  const out = component[sinkName] || O.never()
  return out
}

export function defaultUndefined(component, sinkName) {
  return component[sinkName] || O.of(undefined)
}

export function blankComponent() {
  return {
    DOM: O.never(),
    MapDOM: O.never(),
    Router: O.never(),
    Global: O.never(),
    Storage: O.never(),
    HTTP: O.never(),
    Heartbeat: O.never(),
    message$: O.never()
  }
}

export function blankComponentUndefinedDOM() {
  return {
    DOM: O.of(undefined),
    MapDOM: O.never(),
    Router: O.never(),
    Global: O.never(),
    Storage: O.never(),
    HTTP: O.never(),
    Heartbeat: O.never(),
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
  const MapDOM = mergeSelective(...components.map(c => c.MapDOM).filter(x => !!x))
  const HTTP = mergeSelective(...components.map(c => c.HTTP).filter(x => !!x))
  const Router = mergeSelective(...components.map(c => c.Router).filter(x => !!x))
  const Global = mergeSelective(...components.map(c => c.Global).filter(x => !!x))
  const Storage = mergeSelective(...components.map(c => c.Storage).filter(x => !!x))
  const Heartbeat = mergeSelective(...components.map(c => c.Heartbeat).filter(x => !!x))
  const message$ = mergeSelective(...components.map(c => c.message$).filter(x => !!x))
  return {
    MapDOM, HTTP, Router, Global, Storage, Heartbeat, message$
  }
}

export function normalizeComponent(component) {
  return {
    ...component,
    DOM: defaultNever(component, `DOM`),
    MapDOM: defaultNever(component, `MapDOM`),
    Router: defaultNever(component, `Router`),
    Global: defaultNever(component, `Global`),
    Storage: defaultNever(component, `Storage`),
    HTTP: defaultNever(component, `HTTP`),
    Heartbeat: defaultNever(component, `Heartbeat`),
    message$: defaultNever(component, `message$`),
  }
}

export function normalizeComponentStream(component$) {
  return {
    DOM: normalizeSink(component$, `DOM`),
    MapDOM: normalizeSink(component$, `MapDOM`),
    Router: normalizeSink(component$, `Router`),
    Global: normalizeSink(component$, `Global`),
    Storage: normalizeSink(component$, `Storage`),
    HTTP: normalizeSink(component$, `HTTP`),
    Heartbeat: normalizeSink(component$, `Heartbeat`),
    message$: normalizeSink(component$, `message$`),
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

export const checkValidity = x => x.valid ? x.value : null

export function processHTTP(sources, category) {
  const {HTTP} = sources

  const out$ = HTTP.select(category)
    .switchMap(res$ => res$
      .map(res => {
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

  return {
    good$: out$.filter(x => x.type === "good").map(x => x.data).publish().refCount(),
    bad$: out$.filter(x => x.type === "bad").map(x => x.data),
    ugly$: out$.filter(x => x.type === "ugly").map(x => x.data)
  }

}

// export function filterHTTP(sources, url) {
//   const response$ = sources.HTTP.response$$.filter(res$ => res$.request.url === url).flatten().remember()
//
//   const good$ = response$
//     .filter(x => x.status === 200)
//     .map(x => x.body)
//     .remember()
//
//   const bad$ = response$
//     .filter(x => x.status !== 200)
//     .remember()
//
//   const error$ = good$
//     .filter(x => x.type === `error`)
//     .map(x => x.data)
//     .remember()
//
//   const success$ = good$
//     .filter(x => x.type === `success`)
//     .map(x => x.data)
//     .remember()
//
//   return {
//     bad$,
//     error$,
//     success$
//   }
// }
