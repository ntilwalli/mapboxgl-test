import {Observable as O} from 'rxjs'
import Immutable from 'immutable'
import moment from 'moment'
import {between, notBetween, combineObj, spread, toMoment} from '../../utils'
import {getMomentFromStateInfo, getDateFromStateInfo} from './utils'

function getCurrentDate(d) {
  return {
    year: d.year(),
    month: d.month(),
    date: d.date()
  }
}

function reducers(actions, inputs) {
  return O.never()
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const initialState$ = inputs.initialState$ || O.of(undefined)
  const props$ = inputs.props$ || O.of({defaultNow: false})

  return props$
      .map(props => {
        return {
          month: props.month,
          year: props.year,
          selected: (props.selected || []).map((d) => getCurrentDate(toMoment(d)))
        }
      })
      .publishReplay(1).refCount()
}
