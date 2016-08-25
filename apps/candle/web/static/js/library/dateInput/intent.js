import xs from 'xstream'
import {between, notBetween} from '../../utils'

export default function intent(sources) {
  const {DOM} = sources

  const UP_KEYCODE = 38
  const DOWN_KEYCODE = 40
  const ENTER_KEYCODE = 13
  const ESC_KEYCODE = 27
  const TAB_KEYCODE = 9

  const input$ = DOM.select('.appInputable').events('input').remember()
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

  const changeMonth$ = xs.merge(nextMonth$.mapTo(1), prevMonth$.mapTo(-1))
  const changeHour$ = xs.merge(nextHour$.mapTo(1), prevHour$.mapTo(-1))
  const changeMinute$ = xs.merge(nextMinute$.mapTo(1), prevMinute$.mapTo(-1))
  const changeMode$ = DOM.select('.appChangeMode').events('click')

  const selectorMouseDown$ = DOM.select('.appSelector').events('mousedown')
  const selectorMouseUp$ = DOM.select('.appSelector').events('mouseup')
  const inputFocus$ = DOM.select('.appInputable').events('focus').remember()
  const inputBlur$ = DOM.select('.appInputable').events('blur')
    .filter(ev => ev.target !== document.activeElement) // <--- sketchy? :)

  const enterPressed$ = keydown$.filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const tabPressed$ = keydown$.filter(({keyCode}) => keyCode === TAB_KEYCODE)
  const escPressed$ = keydown$.filter(({keyCode}) => keyCode === ESC_KEYCODE)
  const clearField$ = input$.filter(ev => ev.target.value.length === 0)

  const inputBlurToSelector$ = inputBlur$.compose(between(selectorMouseDown$, selectorMouseUp$))
    .debug(`to selector`)
  const inputBlurToElsewhere$ = inputBlur$.compose(notBetween(selectorMouseDown$, selectorMouseUp$))
    .debug(`to elsewhere`)


  const selectorMouseClick$ = selectorMouseDown$
    .map(down => selectorMouseUp$.filter(up => down.target === up.target))
    .flatten()

  return {
    displayPicker$: xs.merge(
      inputFocus$.mapTo(true),
      inputBlurToSelector$.mapTo(true),
      inputBlurToElsewhere$.mapTo(false)
    ),
    keepFocusOnInput$: inputBlurToSelector$.debug(`keep focus on input`),
    itemClick$,
    changeMonth$,
    changeHour$,
    changeMinute$,
    changeMode$
  }
}
