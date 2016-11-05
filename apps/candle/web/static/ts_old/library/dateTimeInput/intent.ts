import {Observable as O} from 'rxjs'
import {between, notBetween} from '../../utils'

export default function intent(sources) {
  const {DOM} = sources

  const UP_KEYCODE = 38
  const DOWN_KEYCODE = 40
  const ENTER_KEYCODE = 13
  const ESC_KEYCODE = 27
  const TAB_KEYCODE = 9

  const input$ = DOM.select('.appInputable').events('input')
    .publishReplay(1).refCount()
  const keydown$ = DOM.select('.appInputable').events('keydown')
  const itemHover$ = DOM.select('.appSelectable').events('mouseenter')
  const itemClick$ = DOM.select('.appSelectable').events('click').map(ev => {
     return ev.target.dataset.date
   })

  const nextMonth$ = DOM.select('.appNextMonth').events('click').map(x => {
    return x
  })
  const prevMonth$ = DOM.select('.appPrevMonth').events('click')

  const nextHour$ = DOM.select('.appIncrementHour').events('click')
  const prevHour$ = DOM.select('.appDecrementHour').events('click')
  const nextMinute$ = DOM.select('.appIncrementMinute').events('click')
  const prevMinute$ = DOM.select('.appDecrementMinute').events('click')
  const nextMeridiem$ = DOM.select('.appIncrementMeridiem').events('click')
  const prevMeridiem$ = DOM.select('.appDecrementMeridiem').events('click')

  const changeMonth$ = O.merge(nextMonth$.mapTo(1), prevMonth$.mapTo(-1))
  const changeHour$ = O.merge(nextHour$.mapTo(1), prevHour$.mapTo(-1))
  const changeMinute$ = O.merge(nextMinute$.mapTo(1), prevMinute$.mapTo(-1))
  const changeMeridiem$ = O.merge(nextMeridiem$.mapTo(12), prevMeridiem$.mapTo(-12))

  const selectorMouseDown$ = DOM.select('.appSelector').events('mousedown')
      // .do(x => console.log(`selector mouse down`, x))
      .publish().refCount()
  const selectorMouseUp$ = DOM.select('.appSelector').events('mouseup')
      //   .startWith(`start`)
      //   .map(x => {
      //     if (x === `start`) {
      //       console.log(`starting selectorMouseUp$`)
      //     }

      //     return x
      //   })
      // .filter(x => x !== `start`)
      // .finally(() => console.log(`terminating selectorMouseUp$`))
      // .do(x => console.log(`selector mouse up`, x))
      .publish().refCount()
  const inputFocus$ = DOM.select('.appInputable').events('focus')
    .publish().refCount()
  const inputBlur$ = DOM.select('.appInputable').events('blur')
    .filter(ev => ev.target !== document.activeElement) // <--- sketchy? :)
    .publish().refCount()

  const enterPressed$ = keydown$.filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const tabPressed$ = keydown$.filter(({keyCode}) => keyCode === TAB_KEYCODE)
  const escPressed$ = keydown$.filter(({keyCode}) => keyCode === ESC_KEYCODE)
  const clearField$ = input$.filter(ev => ev.target.value.length === 0)

  const inputBlurToSelector$ = selectorMouseDown$.switchMap(() => inputBlur$.takeUntil(selectorMouseUp$))
    .do(x => console.log(`to selector`, x))
    //.publish().refCount()
  const inputBlurToElsewhere$ = O.merge(
    inputBlur$.takeUntil(selectorMouseDown$),
    selectorMouseDown$.switchMap(() => inputBlur$.skipUntil(selectorMouseUp$))
  ).do(x => console.log(`to elsewhere`, x))

  const clear$ = DOM.select(`.appClear`).events(`click`)

  return {
    displayPicker$: O.merge(
      inputFocus$.mapTo(true),
      //inputBlurToSelector$.mapTo(true),
      inputBlurToElsewhere$.mapTo(false)
    ),
    keepFocusOnInput$: inputBlurToSelector$
      .do(x => console.log(`keep focus on input`, x)),
    itemClick$,
    changeMonth$,
    changeHour$,
    changeMinute$,
    changeMeridiem$,
    clear$
  }
}
