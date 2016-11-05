import {Observable as O} from 'rxjs'

export default function intent(sources) {
  const {DOM} = sources

  const nextHour$ = DOM.select('.appIncrementHour').events('click')
  const prevHour$ = DOM.select('.appDecrementHour').events('click')
  const nextMinute$ = DOM.select('.appIncrementMinute').events('click')
  const prevMinute$ = DOM.select('.appDecrementMinute').events('click')
  const nextMeridiem$ = DOM.select('.appIncrementMeridiem').events('click')
  const prevMeridiem$ = DOM.select('.appDecrementMeridiem').events('click')

  const changeHour$ = O.merge(nextHour$.mapTo(1), prevHour$.mapTo(-1))
  const changeMinute$ = O.merge(nextMinute$.mapTo(1), prevMinute$.mapTo(-1))
  const changeMeridiem$ = O.merge(nextMeridiem$.mapTo(12), prevMeridiem$.mapTo(-12))


  return {
    changeHour$,
    changeMinute$,
    changeMeridiem$,
  }
}
