import xs from 'xstream'
import delay from 'xstream/extra/delay'
import {div, span, input, i, a} from '@cycle/dom'
import {attrs, renderExternalLink, noopListener} from '../../../utils'

import Heading from '../../../heading/main'
import Logo from '../../../heading/logo/main'
import SaveExit from './saveExit/main'

export default function main(sources, inputs) {

  const headingInputs = {
    props$: xs.of([{
        name: `heading`,
        component: Logo
      }
      , {
        name: `heading`,
        component: SaveExit
      }
    ]),
    parentState$: inputs.parentState$,
    message$: inputs.message$
  }

  const heading = Heading(sources, headingInputs)

  return {
    DOM: heading.DOM,
    message$: heading.message$
  }
}
