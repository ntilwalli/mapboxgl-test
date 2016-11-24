import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM, spread} from '../../../../utils'
import Modal from '../../../../library/doneModal'
import SearchArea from './searchArea/main'


export default function getModal(sources, inputs, {modal, session}) {
    //console.log(`calling getModal with listing`, listing)
    const session$ = O.of(session).publishReplay(1).refCount()
    if (modal === `searchArea`) {
      return Modal(sources, spread(
        inputs, {
        component: (sources, inputs) => SearchArea(sources, spread(inputs, {
          session$
        })),
        props$: O.of({
          headerText: `Change Search Area`,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else {
      return blankComponentUndefinedDOM()
    }
}