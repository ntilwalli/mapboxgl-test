import {Observable as O} from 'rxjs'
import {div, svg} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, spread, processHTTP} from '../utils'
import moment = require('moment')

const {g, rect} = svg

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function inflateCheckIn(result) {
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `homeCheckIns`)
  const check_ins$ = good$
    .do(x => console.log(`got home/check_ins response`, x))
    .filter(onlySuccess)
    .pluck(`data`)
    .pluck(`check_ins`)
    .map(x => x.map(inflateCheckIn))
    .publish().refCount()
  
  const error$ = good$
    .filter(onlyError)
    .pluck(`data`)
    .publish().refCount()

  const mouseenter$ = DOM.select(`.check-in-grid`).select(`.day`).events(`mouseenter`)
    .map(ev => (ev.target))
    .publishReplay(1).refCount()

  const mouseleave$ = DOM.select(`.check-in-grid`).select(`.day`).events(`mouseleave`)
    .publishReplay(1).refCount()

  // mouseenter$.subscribe(x => console.log(`mouseenter: `, x))
  // mouseleave$.subscribe(x => console.log(`mouseleave: `, x))

  return {
    check_ins$,
    error$,
    mouseenter$,
    mouseleave$
  }
} 

function reducers(actions, inputs) {

  const check_ins_r = actions.check_ins$.map(check_ins => state => {
    console.log(`check_ins`, check_ins)
    return state
  })

  const mouseenter_r = actions.mouseenter$.map(x => state => {
    return state.set(`element`, x)
  })

  const mouseleave_r = actions.mouseleave$.map(x => state => {
    return state.set(`element`, null)
  })

  return O.merge(check_ins_r, mouseenter_r, mouseleave_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$.map(props => {
      const out = getWeekArrays()
      const participation = out.map(x => {
        return x.map(foo => {
          if (!!foo) {
            return {
              date: foo,
              eventCount: Math.floor(Math.random() * 10)
            }
          }

          return null
        })
      })
      
      return {
        participation: props || participation,
        element: null,
        begins: moment().subtract(28, 'days')
      }
    })
    .map(x => Immutable.Map(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}



function renderDay(info, i) {
  if (info) {
    const count = info.eventCount
    let c
    if (count > 5) {
      c = "darkgreen"
    } else if (count > 3) {
      c = "green"
    } else if (count > 0) {
      c = "#d6e685"
    } else {
      c = "lightgray"
    }

    return rect({
      attrs: {
        class: `day`,
        width: 30,
        height: 30,
        x: 33 * i,
        y: 0,
        fill: c,
        "data-date": info.date,
        "data-count": info.count
      }
    })
  } else {
    return null
  }
}

function renderDayLabel(x, index) {
  const offsetY = -8
  return svg.text({attrs: {x: (index * 33) + 9, y: offsetY, class: "dayLabel"}}, [x])
}

function getDayLabels() {
  const dayAcronyms = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  return dayAcronyms.map(renderDayLabel)
}

function renderTooltip(boundingRect) {
  const text = "Hello how are you"
  const length = text.length
  const width = length * 6
  const offsetX = width/2
  const x = boundingRect.left - offsetX
  const y = boundingRect.top - 40
  return div({style: {position: "fixed", top: `${y}px`, left: `${x}px`, color: "white", padding: ".5rem", backgroundColor: "rgba(0, 0, 0, 0.8)"}}, [
    text
  ])
}

function getEmptyWeekArray() {
  return [null, null, null, null, null, null, null]
}

function getWeekArrays() {
  let day_index = 28
  let curr_date = moment()//.add(2, 'day')
  let curr_index = curr_date.day()
  let week_array = getEmptyWeekArray()
  const out_array = []
  while (day_index > 0) {
    if (curr_date.month() === 1 && curr_date.date() === 29) {
      day_index ++
    }

    if (curr_index < 0) {
      out_array.push(week_array)
      week_array = getEmptyWeekArray()
      curr_index = 6
    }

    week_array[curr_index] = curr_date.toDate()
    curr_date.subtract(1, 'day')
    curr_index--
    day_index--
  }

  out_array.push(week_array)

  return out_array
}

function view(state$) {
  return state$.map(state => {
    const {participation, element} = state
    const boundingRect = element && element.getBoundingClientRect()


    const squares = participation.map((arr, index) => {
      return g({attrs: {transform: `translate(0, ${index * 33})`}}, 
        arr.map(renderDay)
      )
    }).concat(getDayLabels())

    return div(`.check-in-grid-container`, {style: {display: "flex", justifyContent: "center", position: "relative"}}, [
      svg({attrs: {width: 241, height: 1746, class: `check-in-grid`}}, [
        g({attrs: {transform: `translate(0, 30)`}}, squares)
      ]),
      element ? renderTooltip(element.getBoundingClientRect()) : null
    ])
  })
}
export function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, {props$: O.of(undefined)})
  const vtree$ = view(state$) 
  return {
    DOM: vtree$,
    HTTP: state$.map(state => state.begins.clone())
      .distinctUntilChanged((x, y) => {
        //console.log(`blah`, x)
        //console.log(y)
        const isSame = x.isSame(y)
        //console.log(isSame)
        return isSame
      })
      .map(begins => {
        return {
          url: `/api/user`,
          method: `post`,
          category: `homeCheckIns`,
          send: {
            route: `/home/check_ins`,
            data: {
              begins: begins,
              ends: begins.clone().add(28, 'days')
            }
          }
        }
      })
  }
}
