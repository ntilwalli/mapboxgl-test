import {Observable as O} from 'rxjs'
import {blankComponentUndefinedDOM, spread} from '../../../utils'

import Modal from '../../../library/modal/done/main'

import ChooseDate from './chooseDate/main'
import ChooseTime from './chooseTime/main'


export default function getModal(sources, inputs, {modal, listing}) {

    if (modal === `startDate` || modal === `untilDate`) {
      const time = listing.profile.time
      const d = modal === `startDate` ? time.startDate : time.until
      const title = modal === `startDate` ? `Change start date` : `Change until date`
      return Modal(sources, spread(
        inputs, {
        component: (sources, inputs) => ChooseDate(sources, spread(inputs, {
          initialState$: O.of(d)
        })),
        props$: O.of({
          headerText: title,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else if (modal === `startTime` || modal === `endTime`) {
      const time = listing.profile.time
      const d = modal === `startTime` ? time.startTime : time.endTime
      const title = modal === `startTime` ? `Change start time` : `Change end time`
      return Modal(sources, spread(
        inputs, {
        component: (sources, inputs) => ChooseTime(sources, spread(inputs, {
          initialState$: O.of(d)
        })),
        props$: O.of({
          headerText: title,
          type: `standard`,
          alwaysShowHeader: false
        })
      }))
    } else {
      return blankComponentUndefinedDOM(sources, inputs)
    }
}