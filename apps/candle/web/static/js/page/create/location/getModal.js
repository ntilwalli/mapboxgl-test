import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM, spread} from '../../../utils'

import Modal from '../../../library/modal/done/main'

import Address from './address/main'
import SearchArea from './searchArea/main'


export default function getModal(sources, inputs, {modal, listing}) {
    //console.log(`calling getModal with listing`, listing)
    const listing$ = O.of(listing).publishReplay(1).refCount()
    if (modal === `searchArea`) {
      return Modal(sources, spread(
        inputs, {
        component: (sources, inputs) => SearchArea(sources, spread(inputs, {
          listing$
        })),
        props$: O.of({
          headerText: `Change Search Area`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else {
      return blankComponentUndefinedDOM(sources, inputs)
    }
}