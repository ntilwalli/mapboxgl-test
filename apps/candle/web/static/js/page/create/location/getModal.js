import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM, spread} from '../../../utils'

import Modal from '../../..//library/modal/simple/main'

import Address from './address/main
import Vicinity from './vicinity/main'


export default function getModal(sources, inputs, modal) {
    if (modal === `vicinity`) {
      return Modal(sources, spread(
        inputs, {
        component: Vicinity,
        props$: O.of({
          headerText: `Change Vicinity`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else if (modal === `address`) {
      return Modal(sources, spread(
        inputs, {
        component: Address,
        props$: O.of({
          headerText: `Set Address`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else {
      return blankComponentUndefinedDOM(sources, inputs)
    }
}