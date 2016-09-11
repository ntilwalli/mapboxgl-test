import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM, spread} from '../../../utils'

import Modal from '../../../library/modal/done/main'

import Address from './address/main'
import Vicinity from './vicinity/main'


export default function getModal(sources, inputs, {modal, listing}) {
    const listing$ = O.of(listing)
    if (modal === `vicinity`) {
      return Modal(sources, spread(
        inputs, {
        component: (sources, inputs) => Vicinity(sources, spread(inputs, {
          listing$
        })),
        props$: O.of({
          headerText: `Change Vicinity`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else {
      return blankComponentUndefinedDOM(sources, inputs)
    }
}