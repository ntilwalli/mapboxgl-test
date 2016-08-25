import {Observable as O} from 'rxjs'
import {div, button} from '@cycle/dom'
import {combineObj} from '../../utils'

export default function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .map(inputs => {
      const {state, components} = inputs
      const {authorization, geolocation, showModal} = state
      const {modal} = components
      const authString = JSON.stringify(authorization)
      const ll = geolocation.position || {}
      const geoString = JSON.stringify({coords: ll, region: geolocation.region})
      return div([
        div([authString]),
        div([geoString]),
        div(
          authorization ? [button(`.logout`, [`logout`])] : [button(`.login`, [`login`]), button(`.signup`, [`signup`])]
        ),
        div(
          !authorization ? [button(`.presignup`, [`presignup`])] : [null]
        ),
        div([button(`.showModal`, [`show modal`])]),
        showModal ? modal : null
      ])
    })
}
