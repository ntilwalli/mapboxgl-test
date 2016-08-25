import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import delay from 'xstream/extra/delay'
import view from './view'
import intent from './intent'
import model from './model'

import {div, input, img, svg} from '@cycle/DOM'

import {noopListener, normalizeSink} from '../../utils'
import combineObj from '../../combineObj'

import WorkflowHeading from './heading/main'
import LandingHeading from './landing/heading/main'
import Landing from './landing/main'
import ListingType from './listingType/main'
import Location from './location/main'
import Name from './name/main'
import ConfirmAddressLocation from './confirmAddressLocation/main'
import EventDateTime from './eventDateTime/main'

function convertRouteToComponent(route, sources, inputs, state$) {
  console.log(`converting route to component...`)
  const landingWithListingId = /^\/create\/[0-9]+\/?$/
  const landingWithoutListingId = /^\/create\/?$/
  const locationWithoutListingId = /^\/create\/location\/?$/
  const nameWithoutListingId = /^\/create\/name\/?$/
  const listingTypeWithoutListingId = /^\/create\/listingType\/?$/
  const pageMatcher = /\/create\/([0-9]+)\/([a-zA-Z]+)\/?$/

  const path = route.pathname
  let match

  if (route.state) {
    console.log(`route.path: ${route.pathname}`)
    if (match = path.match(landingWithoutListingId)) {
      return {
        type: `success`,
        data: {
          heading: LandingHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
          form: Landing(sources, inputs),
          image: {
            DOM: xs.of(div(`.image-section`, [
              img(`.image-element`, {attrs: {src:`/images/floralMicrophone.svg`}})
            ])),
            message$: xs.never()
          }
        }
      }
    } else if (match = path.match(landingWithListingId)) {
      console.log(`Landing with listing id...`)
      return {
        type: `success`,
        data: {
          heading: LandingHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
          form: Landing(sources, inputs),
          image: {
            DOM: xs.of(div(`.image-section`, [
              img(`.image-element`, {attrs: {src:`/images/floralMicrophone.svg`}})
            ])),
            message$: xs.never()
          }
        }
      }
    } else if (match = path.match(locationWithoutListingId)) {
      console.log(`location without listing id`)
      return {
        type: `success`,
        data: {
          heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
          form: Location(sources, inputs),
          image: {
            DOM: xs.of(div(`.image-section`, [
              img(`.image-element`, {attrs: {src:`/images/floralMicrophone.svg`}})
            ])),
            message$: xs.never()
          }
        }
      }

    } else if (match = path.match(listingTypeWithoutListingId)){
      console.log(`Listing type without listing id with state...`)
      return {
        type: `success`,
        data: {
          heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
          form: ListingType(sources, inputs),
          instruction: {
            DOM: xs.of(div(`.instruction-content`, [
              div([`A one-off event is just that.  An event group covers things like recurring events or event series which should have it's own listing page independent from it's child listings.`])
            ])),
            message$: xs.never()
          }
        }
      }

    } else if (match = path.match(nameWithoutListingId)) {
      console.log(`Name without listing id with state...`)
      //console.log(inputs)

      return {
        type: `success`,
        data: {
          heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
          form: Name(sources, inputs),
          instruction: {
            DOM: xs.of(div(`.instruction-content`, [
              div([`Example names: 'Penny's Open Mic', 'Battle of the Pand(a)s'`])
            ])),
            message$: xs.never()
          }
        }
      }

    } else if (match = path.match(pageMatcher)) {

      const selector = match[2]
      console.log(`matched pageMatcher: ${selector}`)

      if (selector === `listingType`) {
        return {
          type: `success`,
          data: {
            heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
            form: ListingType(sources, inputs),
            instruction: {
              DOM: xs.of(div(`.instruction-content`, [
                div([`A one-off event is just that.  An event group covers things like recurring events or event series which should have it's own listing page independent from it's child listings.`])
              ])),
              message$: xs.never()
            }
          }
        }
      } else if (selector === `name`) {

        return {
          type: `success`,
          data: {
            heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
            form: Name(sources, inputs),
            instruction: {
              DOM: xs.of(div(`.instruction-content`, [
                div([`Example names: 'Penny's Open Mic', 'Battle of the Pand(a)s'`])
              ])),
              message$: xs.never()
            }
          }
        }
      } else if (selector === `location`) {

        return {
          type: `success`,
          data: {
            heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
            form: Location(sources, inputs),
            instruction: {
              DOM: xs.of(div(`.instruction-content`, [
                div([`Selecting a good search region will improve your autocomplete results for venue and address modes.`])
              ])),
              message$: xs.never()
            }
          }
        }
      } else if (selector === `confirmAddressLocation`) {

        return {
          type: `success`,
          data: {
            heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
            form: ConfirmAddressLocation(sources, inputs),
            instruction: {
              DOM: xs.of(div(`.instruction-content`, [
                div([`Sometimes the marker gets positioned wrong, adjust it here if necessary, otherwise just hit 'Next'...`])
              ])),
              message$: xs.never()
            }
          }
        }
      } else if (selector === `time`) {

        return {
          type: `success`,
          data: {
            heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
            form: EventDateTime(sources, inputs),
            instruction: {
              DOM: xs.of(div(`.instruction-content`, [
                div([`Times are local to the location of the event...`])
              ])),
              message$: xs.never()
            }
          }
        }
      } else {
        return {
          type: `success`,
          data: {
            heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
            form: {
              DOM: xs.of(div([`Not implemented`])),
              message$: xs.never()
            },
            image: {
              DOM: xs.of(div(`.image-section`, [
                img(`.image-element`, {attrs: {src:`/images/floralMicrophone.svg`}})
              ])),
              message$: xs.never()
            }
          }
        }
      }
    } else {

      return {
        type: `error`,
        data: `Could not match route with state + pathname`
      }

    }
  } else {

    if (match = path.match(listingTypeWithoutListingId)) {
      console.log(`Listing type without listing id...`)
      //console.log(inputs)
      return {
        type: `success`,
        data: {
          heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
          form: ListingType(sources, inputs),
          instruction: {
            DOM: xs.of(div(`.instruction-content`, [
              div([`A one-off event is just that.  An event group covers things like recurring events or event series which should have it's own listing page independent from it's child listings.`])
            ])),
            message$: xs.never()
          }
        }
      }

    }
    // else if (match = path.match(nameWithoutListingId)) {
    //   console.log(`Name without listing id with state...`)
    //   //console.log(inputs)
    //
    //   return {
    //     type: `success`,
    //     data: {
    //       heading: WorkflowHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
    //       form: Name(sources, inputs),
    //       instruction: {
    //         DOM: xs.of(div(`.instruction-content`, [
    //           div([`Example names: 'Penny's Open Mic', 'Battle of the Pand(a)s'`])
    //         ])),
    //         message$: xs.never()
    //       }
    //     }
    //   }
    // }
    else if (match = path.match(landingWithoutListingId)) {
      console.log(`Landing without listing id...`)
      return {
        type: `success`,
        data: {
          heading: LandingHeading(sources, {parentState$: state$}), //WorkflowHeading(sources, {state$}),
          form: Landing(sources, inputs),
          image: {
            DOM: xs.of(div(`.image-section`, [
              img(`.image-element`, {attrs: {src:`/images/floralMicrophone.svg`}})
            ])),
            message$: xs.never()
          }
        }
      }
    } else {
      return {
        type: `error`,
        data: `Invalid path given with no state`
      }
    }
  }
}

export default function main(sources, inputs) {

  console.log(`Workflow construction...`)
  //const testHistory$ = sources.Router.history$.debug(`workflow history$`).addListener(noopListener)

  const component$ = sources.Router.history$
    //.debug(`history$...`)
    .map(route => {


      const actions = intent(sources)

      const showMenu$ = xs.create()
      // const updatedListing$ = xs.create()
      const routeListing$ = xs.of(route.state)
      const listing$ = xs.merge(routeListing$).remember()
      const eInputs = {
        ...inputs,
        listing$,
        showMenu$
      }

      const state$ = model(actions, eInputs)

      // console.log(`route`)
      // console.log(route)
      const result = convertRouteToComponent(route, sources, eInputs, state$)

      if (result.type === `success`) {
        const components = result.data

        const keys = Object.keys(components)

        let dom = {}, http = {}
        keys.forEach(k => dom[k] = components[k].DOM)
        const toHttp = keys.map(k => components[k].HTTP || xs.never())
        const toStorage = keys.map(k => components[k].Storage || xs.never())
        const toRouter = keys.map(k => components[k].Router || xs.never())

        const toGlobal = keys.map(k => components[k].Global || xs.never())
        const toMapDOM = keys.map(k => components[k].MapDOM || xs.never())
        const messages = keys.map(k => components[k].message$ || xs.never())
        const merged = {
          DOM: combineObj(dom),
          HTTP: xs.merge(...toHttp),
          Router: xs.merge(...toRouter),
          Global: xs.merge(...toGlobal),
          Storage: xs.merge(...toStorage),
          MapDOM: xs.merge(...toMapDOM),
          message$: xs.merge(...messages)
        }

        const message$ = merged.message$

        const logout$ = message$.filter(x => x.type === `logout`)
        const saveExit$ = message$.filter(x => x.type === `saveExit`)
        const menu$ = message$.filter(x => x.type === `menu`).mapTo(true)
        const closeMenu$ = xs.merge(
          message$.filter(x => x.type === `closeMenu`),
          sources.Global.filter(msg => msg.type === `thresholdUp`)
        ).mapTo(false)

        const home$ = message$.filter(x => x.type === `home`)

        //updatedListing$.imitate(message$.filter(x => x.type === `listing`).map(val => val.data))
        showMenu$.imitate(xs.merge(menu$, closeMenu$))

        return {
          DOM: view(state$, merged.DOM),
          HTTP: merged.HTTP,
          Router: xs.merge(merged.Router, home$.mapTo(`/`)),
          Global: merged.Global,
          Storage: merged.Storage,
          MapDOM: merged.MapDOM,
          message$: xs.merge(logout$)
        }
      } else {
        return {
          Router: xs.of({
            pathname: `/create`,
            action: `PUSH`

          }).compose(delay(4))  // delay so the router sink is fully connected before invalid route response is pushed
        }
      }
    })
    .remember()

  // return {
  //     DOM:  normalizeSink(component$, `DOM`, `workflow`).debug(x => {
  //       console.log(`workflow DOM`)
  //       console.log(x)
  //     }),
  //   HTTP: xs.never(),
  //   Router: xs.never(),
  //   Global: xs.never(),
  //   Storage: xs.never(),
  //   MapDOM: xs.never(),
  //   message$: xs.never()
  // }
  //
  return {
    DOM:  normalizeSink(component$, `DOM`),
    HTTP: normalizeSink(component$, `HTTP`),
    Router: normalizeSink(component$, `Router`),
    Global: normalizeSink(component$, `Global`),
    Storage: normalizeSink(component$, `Storage`),
    MapDOM: normalizeSink(component$, `MapDOM`),
    message$: normalizeSink(component$, `message$`)
  }
}
