import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM} from '../../../../utils'

import DoneModal from '../../../../library/bootstrapDoneModal'

import SearchArea from './searchArea/main'


export function main(sources, inputs, {modal, session}) {
  if (modal === `search_area`) {
    const out=  DoneModal(sources, {
      ...inputs,
      content: (sources, inputs) => SearchArea(sources, inputs),
      props$: O.of({title: `Change Search Area`, styleClass: `.sign-up-height`}),
      initialState$: O.of(session.properties.search_area).publishReplay(1).refCount()
    })

    return out
  } else {
    return blankComponentUndefinedDOM()
  }
}