import {Observable as O} from 'rxjs'
import {div, strong, svg} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, spread, processHTTP} from '../utils'
import moment = require('moment')

const {g, rect} = svg

const onlySuccess = x => x.type === "success"
const onlyError = x => x.type === "error"

function inflateCheckIn(result) {
  result.check_in_datetime = moment(result.check_in_datetime)
  result.listing_datetime = moment(result.listing_datetime)
  return result
}

function intent(sources) {
  const {DOM, HTTP} = sources
  const {good$, bad$, ugly$} = processHTTP(sources, `homeCheckIns`)
  const check_ins$ = good$
    //.do(x => console.log(`got home/check_ins response`, x))
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

  return {
    check_ins$,
    error$,
    mouseenter$,
    mouseleave$
  }
} 


function getEmptyBuckets() {
  const out = {}
  for (let i = 1; i < 32; i++) {
    out[i] = []
  }

  return out
}

function getEmptyWeekArray() {
  return [null, null, null, null, null, null, null]
}

function summarizeBucket(date, bucket) {
  // console.log(date)
  // console.log(bucket)
  return {
    eventCount: bucket.length,
    date
  }
}

function getWeekArrays(buckets) {
  //console.log(buckets)
  let day_index = 28
  let curr_date = moment()
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

    week_array[curr_index] = summarizeBucket(curr_date.clone(), buckets[curr_date.date()]) 
    curr_date.subtract(1, 'day')
    curr_index--
    day_index--
  }

  out_array.push(week_array)

  return out_array
}


function reducers(actions, inputs) {

  const check_ins_r = actions.check_ins$.map(check_ins => state => {
    const buckets = getEmptyBuckets()
    //console.log(buckets)
    check_ins.forEach(x => {
      //console.log(x.check_in_datetime)
      //console.log(x.check_in_datetime.date())
      buckets[x.check_in_datetime.date()].push(x)
    })
    //console.log(`buckets`, buckets)
    return state.set(`buckets`, buckets).set(`in_flight`, false)
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

  return inputs.props$.map(buckets => {
      //const out = getWeekArrays(undefined)
      // const participation = out.map(x => {
      //   return x.map(foo => {
      //     if (!!foo) {
      //       return {
      //         date: foo,
      //         eventCount: Math.floor(Math.random() * 10),
      //         buckets: undefined
      //       }
      //     }

      //     return null
      //   })
      // })
      
      return {
        buckets: undefined,
        in_flight: true,
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
        "data-count": info.eventCount
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

function renderTooltip(el) {
  const boundingRect = el.getBoundingClientRect()
  //console.log(`tooltip info...`)
  const count = parseInt(el.getAttribute("data-count"))
  const date = moment(new Date(el.getAttribute("data-date")))
  //console.log(date)
  const text = `${count ? count : 'No'} mics, ` + date.format('LL') 
  const length = text.length
  const width = length * 8
  const offsetX = width/2
  const x = boundingRect.left - offsetX
  const y = boundingRect.top - 40
  return div({style: {position: "fixed", fontSize: "90%", top: `${y}px`, left: `${x}px`, color: "white", padding: ".5rem", backgroundColor: "rgba(0, 0, 0, 0.8)"}}, [
    strong([`${count ? count : 'No'} mics`]),
    `, ${date.format('LL')}`
  ])
}



function view(state$) {
  return state$.map(state => {
    const {buckets, in_flight, element} = state
    const boundingRect = element && element.getBoundingClientRect()


    const squares = in_flight ? null : getWeekArrays(buckets).map((arr, index) => {
      return g({attrs: {transform: `translate(0, ${index * 33})`}}, 
        arr.map(renderDay)
      )
    }).concat(getDayLabels())

    return in_flight ? null : div(`.check-in-grid-container`, {style: {display: "flex", justifyContent: "center", position: "relative"}}, [
      svg({attrs: {width: 241, height: 1746, class: `check-in-grid`}}, [
        g({attrs: {transform: `translate(0, 30)`}}, squares)
      ]),
      element ? renderTooltip(element) : null
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
        const isSame = x.isSame(y)
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
