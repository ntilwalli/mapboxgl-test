import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import routeFunction from '../../../localDrivers/routeFunction/main'

import {normalizeComponentStream} from '../../../utils'

import Landing from '../landing/main'
import Meta from '../meta/main'
import Description from '../description/main'
import Location from '../location/main'
import ConfirmAddressLocation from '../confirmAddressLocation/main'

import RedirectRestricted from '../../../redirectRestricted'
import RedirectCreate from '../../../redirectCreate'

// const Description = () => ({
//   DOM: O.of(div([`Workflow`]))
// })

const routes = [
  {pattern: /^\/meta$/, value: {type: "component", data: Meta}},
  {pattern: /^\/description$/, value: {type: "component", data: Description}},
  {pattern: /^\/location$/, value: {type: "component", data: Location}},
  {pattern: /^\/confirmAddressLocation$/, value: {type: "component", data: ConfirmAddressLocation}},
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
      return data(sources, inputs)
    })
    .cache(1)

  return normalizeComponentStream(component$)
}