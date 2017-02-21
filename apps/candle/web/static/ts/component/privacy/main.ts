import {Observable as O} from 'rxjs'
import {div, button, li, nav, span, select, input, option, label, h6} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, createProxy, mergeSinks, processHTTP, traceStartStop, onlyError, onlySuccess, normalizeArcGISSingleLineToParts} from '../../utils'

import Navigator from '../../library/navigators/simple'

function renderContent() {
  return div(`.container-fluid.mt-4`, [
    'At Stumplog your privacy is our number six priority, falling slightly behind coding, building fun shit, being good people, being funny and sleeping.  Key thing is privacy is ON the list and that\'s what matters. We will only use your email address and/or phone number for keeping you updated on what\'s going on with your Stumplog specific activity which you\'ll def be interested in.  We won\'t share any of your information with any other users of the site or any third-party ever.'
  ])
}

function view(components) {
  return combineObj(components)
    .map((components: any) => {
      const {navigator} = components
      return div(`.screen`, [
        navigator,
        renderContent()
      ])
    })
}


function main(sources, inputs) {

  const navigator = Navigator(sources, inputs)

  const components = {
    navigator: navigator.DOM
  }

  const vtree$ = view(components)


  const out = {
    ...navigator,
    DOM: vtree$
  }

  return out
}

export {
  main
}