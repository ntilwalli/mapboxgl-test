import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import routeFunction from '../../../localDrivers/routeFunction/main'

import {normalizeComponentStream, spread} from '../../../utils'

import Landing from '../landing/main'
import Meta from '../meta/main'
import Description from '../description/main'
import Location from '../location/main'
import ConfirmAddressLocation from '../confirmAddressLocation/main'
import Time from '../eventDateTime/main'
import Recurrence from '../recurringDateTime/main'
import Preview from '../preview/main'
import SuccessMessage from '../successMessage/main'

import RedirectRestricted from '../../../redirectRestricted'
import RedirectCreate from '../../../redirectCreate'

const Properties = () => ({
  DOM: O.of(div([`Properties`]))
})

// const PostingSuccess = () => ({
//   DOM: O.of(div([`Posting success`]))
// })

const StagingSuccess = () => ({
  DOM: O.of(div([`Staging success`]))
})

const routes = [
  {pattern: /^\/meta$/, value: {type: "component", data: Meta}},
  {pattern: /^\/description$/, value: {type: "component", data: Description}},
  {pattern: /^\/location$/, value: {type: "component", data: Location}},
  {pattern: /^\/confirmAddressLocation$/, value: {type: "component", data: ConfirmAddressLocation}},
  {pattern: /^\/time$/, value: {type: "component", data: Time}},
  {pattern: /^\/recurrence$/, value: {type: "component", data: Recurrence}},
  {pattern: /^\/properties$/, value: {type: "component", data: Properties}},
  {pattern: /^\/preview$/, value: {type: "component", data: Preview}},
  {
    pattern: /^\/postSuccess$/, value: {
      type: "component", 
      data: (sources, inputs) => SuccessMessage(sources, spread(inputs, {props$: O.of(`posted`)}))
    }
  },
  {
    pattern: /^\/stageSuccess$/, value: {
      type: "component", 
      data: (sources, inputs) => SuccessMessage(sources, spread(inputs, {props$: O.of(`staged`)}))
    }
  },
  {pattern: /^\/?$/, value: {type: "component", data: Landing}},
  {pattern: /\/?.*/, value: {type: `error`, data: RedirectCreate}},
]

export default function main(sources, inputs) {
  const {Router} = sources
  const route$ = Router.define(routes, routeFunction)

  const component$ = route$
    .map(route => {
      const {value, path} = route
      const match = value.match
      const {type, data} = value.info
      //return data(sources, inputs)
      let component = data
      return component(spread(sources, {Router: Router.path(path)}), spread(inputs, {ParentRouter: Router}))
    })
    .publishReplay(1).refCount()

  return normalizeComponentStream(component$)
}