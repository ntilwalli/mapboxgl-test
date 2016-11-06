import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import {combineObj, normalizeSink} from '../../../../utils'
import intent from './intent'
import model from './model'
import view from './view'

import deepEqual = require('deep-equal')
import moment = require('moment')

const log = console.log.bind(console)

const geoToLngLat = x => {
  const {latitude, longitude} = x.data.coords
  return {lng: longitude, lat: latitude}
}

function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const vtree$ = view(state$) 

  return {
    DOM: vtree$
  }
}

export default main

