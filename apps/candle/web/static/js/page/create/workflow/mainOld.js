import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import view from './view'
import intent from './intent'
import model from './model'

import {div} from '@cycle/DOM'

import {noopListener, normalizeSink} from '../../utils'
import combineObj from '../../combineObj'

import WorkflowHeading from './heading/main'
import LandingHeading from './landingHeading/main'
import Landing from './landing/main'
import Location from './location/main'


export default function main(sources, inputs) {

  console.log(`Constructing Workflow...`)

  const showMenu$ = xs.create()
  const actions = intent(sources)
  const state$ = model(actions, {...inputs, location$: xs.never(), showMenu$})

 //  const routes = {
 //   //'/': {retriever: () => Landing({props$: state$.take(1), ...enrichedSources}), restricted: true, name: `createLandingNew`},
 //   '/': {
 //     retriever: () => {
 //       return Landing(sources, inputs)
 //     },
 //     restricted: true,
 //     name: `LandingExisting`
 //   },
 //   '/location': {
 //     retriever: () => {
 //       return Location(sources, inputs)
 //     },
 //     restricted: true,
 //     name: `Location`
 //   }
 //   //'/event': () => ({retriever: () => CreateEvent({props$: state$.take(1), ...enrichedSources}), restricted: true, name: `createEvent`}),
 //   //'/group': () => ({retriever: () => CreateGroup({props$: state$.take(1), ...enrichedSources}), restricted: true, name: `createGroup`}),
 // }

  const component$ = sources.Router.history$
    .map(route => {
      console.log(`workflow route...`)
      console.log(route)
      const pathname = route.pathname
      return {
        heading: LandingHeading(sources, {state$}), //WorkflowHeading(sources, {state$}),
        form: Landing(sources, {props$: state$}),
        controller: {
          DOM: xs.of(undefined),
          message$: xs.of(undefined)
        },
        instructions: {
          DOM: xs.of(undefined),
          message$: xs.of(undefined)
        }
      }
    })
    .map(components => {
      const keys = Object.keys(components)
      let dom = {}, http = {}
      keys.forEach(k => dom[k] = components[k].DOM)
      const toHttp = keys.map(k => components[k].HTTP || xs.never())
      const toStorage = keys.map(k => components[k].Storage || xs.never())
      const toRouter = keys.map(k => components[k].Router || xs.never())
      const toGlobal = keys.map(k => components[k].Global || xs.never())
      const messages = keys.map(k => components[k].message$ || xs.never())
      const out = {
        DOM: combineObj(dom),
        HTTP: xs.merge(...toHttp),
        Router: xs.merge(...toRouter),
        Global: xs.merge(...toGlobal),
        Storage: xs.merge(...toStorage),
        message$: xs.merge(...messages)
      }

      return out
    })
    .remember()

  const message$ = component$
    .map(component => component.message$)
    .flatten().filter(x => !!x)
    .debug(`message`)

  const logout$ = message$.filter(x => x.type === `logout`)
  const saveExit$ = message$.filter(x => x.type === `saveExit`)
  const menu$ = message$.filter(x => x.type === `menu`).mapTo(true)
  const closeMenu$ = xs.merge(
    message$.filter(x => x.type === `closeMenu`),
    sources.Global.filter(msg => msg.type === `thresholdUp`)
  ).mapTo(false)

  showMenu$.imitate(xs.merge(menu$, closeMenu$))
    //.addListener(noopListener)

  //const saveExit$ = message$.debug(`message$...`).addListener(noopListener)

  // view(state$, normalizeSink(component$, `DOM`))
  //   .debug(`from workflow DOM`)
  //   .addListener(noopListener)

  return {
    DOM:  view(state$, normalizeSink(component$, `DOM`)).debug(`from workflow DOM`),
    HTTP: xs.merge(normalizeSink(component$, `HTTP`)),
    Router: normalizeSink(component$, `Router`),
    Global: normalizeSink(component$, `Global`),
    Storage: normalizeSink(component$, `Storage`),
    message$: xs.merge(logout$)
  }
}
