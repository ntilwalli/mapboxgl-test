import xs from 'xstream'
import delay from 'xstream/extra/delay'
import {div, span, input, i, a} from '@cycle/dom'
import {attrs, renderExternalLink, noopListener} from '../../../../utils'

import Heading from '../../../../heading/main'
import Logo from '../../../../heading/logo/main'

import MenuModal from './menuModal/main'

export default function main(sources, inputs) {

  const headingInputs = {
    props$: xs.of([{
        name: `logoComponent`,
        component: Logo
      }
      , {
        name: `menuModal`,
        component: MenuModal
      }
    ]),
    parentState$: inputs.parentState$
  }

  const heading = Heading(sources, headingInputs)

  return {
    DOM: heading.DOM,
    message$: heading.message$
  }
}
