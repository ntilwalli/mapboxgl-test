import {Observable as O} from 'rxjs'
import {div, strong, svg} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj, spread, processHTTP} from '../utils'
import moment = require('moment')

const {g, rect} = svg

function intent(sources) {
  const {DOM, HTTP} = sources

  const mouseenter$ = DOM.select(`.check-in-grid`).select(`.day`).events(`mouseenter`)
    .map(ev => (ev.target))
    .publishReplay(1).refCount()

  const mouseleave$ = DOM.select(`.check-in-grid`).select(`.day`).events(`mouseleave`)
    .publishReplay(1).refCount()

  const click$ = DOM.select(`.check-in-grid`).select(`.day`).events(`click`)
    .map(ev => ev.target)
    .publishReplay(1).refCount()

  return {
    mouseenter$,
    mouseleave$,
    click$
  }
} 

function getEmptyBuckets() {
  const baseline_date = moment().startOf('week').startOf('day').subtract(52*7, 'day')
  const end_of_range = moment().endOf('day')
  const out = {}
  let i = 0;
  let curr
  while ((curr = baseline_date.clone().add(i, 'day')) <= end_of_range) {
    out[i] = {
      date: curr,
      data: []
    }

    i++
  }

  return out
}

function reducers(actions, inputs) {

  const mouseenter_r = actions.mouseenter$.map(x => state => {
    return state.set(`hover_element`, x)
  })

  const mouseleave_r = actions.mouseleave$.map(x => state => {
    return state.set(`hover_element`, null)
  })

  const day_selected_r = actions.click$.map(x => state => {
    return state.set(`click_element`, x)
  })

  return O.merge(mouseenter_r, mouseleave_r, day_selected_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$.map(check_ins => {     
      const baseline_date = moment().startOf('week').subtract(52*7, 'day')
      const buckets = getEmptyBuckets()
      check_ins
        // .sort((x, y) => x.check_in_datetime.date() < y.check_in_datetime.date())
        .forEach((x, index) => {
          const diff_days = x.check_in_datetime.diff(baseline_date, 'day')
          buckets[diff_days].data.push(x)
        })

      return {
        buckets,
        hover_element: null,
        click_element: null
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

const num_weeks = 53;
const cell_xy = 10
const margin_xy = 2;
const day_x = 20
const day_y = cell_xy
const day_margin_x = 5
const month_margin_y = 5
const month_x = 20
const month_y = 10

function getDayLabels() {
  return [
    svg.text({style: {display: "none"}, attrs: {dx: -8, dy:8, class: "day-label"}}, ['Sun']),
    svg.text({attrs: {dx: -8, dy:20, class: "day-label"}}, ['Mon']),
    svg.text({style: {display: "none"}, attrs: {dx: -8, dy:32, class: "day-label"}}, ['Tue']),
    svg.text({attrs: {dx: -8, dy:44, class: "day-label"}}, ['Wed']),
    svg.text({style: {display: "none"}, attrs: {dx: -8, dy:56, class: "day-label"}}, ['Thu']),
    svg.text({attrs: {dx: -8, dy:68, class: "day-label"}}, ['Fri']),
    svg.text({style: {display: "none"}, attrs: {dx: -8, dy:70, class: "day-label"}}, ['Sat'])
  ]
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
  return div({style: {position: "fixed", fontSize: "90%", top: `${y}px`, left: `${x}px`, color: "#DDDDDD", padding: ".5rem", backgroundColor: "rgba(0, 0, 0, 0.8)"}}, [
    strong([`${count ? count : 'No'} mics`]),
    ', ' + date.format('LL')
  ])
}

function getEmptyWeekArray() {
  return [null, null, null, null, null, null, null]
}

function summarizeBucket(curr_date, bucket, click_element) {
  let clicked = false
  if (click_element) {
    if (moment(new Date(click_element.getAttribute(`data-date`))) === curr_date) {
      clicked = true
    }
  }

  return {
    eventCount: bucket.length,
    date: curr_date,
    clicked
  }
}

function getWeekArrays(buckets, click_element) {
  //console.log(buckets)
  let week_array = getEmptyWeekArray()
  const out_array = []
  const month_array = []
  let curr_index = 0;
  let curr;
  let keys = Object.keys(buckets)
  for (let i = 0; i < keys.length; i++) {
    curr = buckets[keys[i]]

    if (curr_index > 6) {
      out_array.push(week_array)
      week_array = getEmptyWeekArray()
      curr_index = 0
    }

    if (curr.date.date() === 1) {
      let month_x
      if (out_array.length === 52) {
        month_x = 20
      } else {
        month_x = 20 + (out_array.length + 1) * (cell_xy + margin_xy)
      }

      month_array.push(svg.text({attrs: {class: 'month-label', x: month_x, y: -8}}, [curr.date.format('MMM')]))
    }

    week_array[curr_index] = summarizeBucket(curr.date, curr.data, click_element) 
    curr_index++
  }

  out_array.push(week_array)

  return [month_array, out_array]
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
      c = "#EEEEEE"
    }

    return rect({
      attrs: {
        class: `day`,
        width: cell_xy,
        height: cell_xy,
        x: 0,
        y: (cell_xy + margin_xy) * i,
        fill: c,
        "stroke-width": info.clicked ? 1 : 0,
        stroke: "rgb(0,0,0)",
        "data-date": info.date,
        "data-count": info.eventCount
      }
    })
  } else {
    return null
  }
}


function view(state$) {
  return state$.map(state => {
    const {buckets, in_flight, click_element, hover_element} = state
    const boundingRect = hover_element && hover_element.getBoundingClientRect()


    const cells_x = cell_xy * num_weeks
    const margins_x = margin_xy * (num_weeks - 1)
    const grid_x = cells_x + margins_x
    const day_headings_margin = 5
    const day_headings_x = 24
    const month_headings_y = 20
    const total_x = grid_x + day_headings_margin +  day_headings_x
    const cell_plus_margin = cell_xy + margin_xy
    const total_y = ((cell_xy + margin_xy) * 6) + cell_xy + month_headings_y;

    let squares
    let months 
    if (!in_flight) {
      [months, squares] = getWeekArrays(buckets, click_element)
      squares = squares.map((arr, index) => {
        return g({attrs: {transform: `translate(${index * cell_plus_margin}, 0)`}}, 
          arr.map(renderDay)
        )
      })
    }

    return in_flight ? null : div(`.row`, [
      div('.col-12', [
        // 'Hello'
        svg({attrs: {width: total_x , height: total_y, class: `check-in-grid`}}, [
          g({attrs: {transform: `translate(8, 20)`}}, [
              g({attrs: {transform: `translate(20, 0)`}}, squares)
            ].concat(getDayLabels())
            .concat(months)

            //g({attrs: {transform: `translate(${grid_x + day_margin_x}, 0)`}}, getDayLabels())
          )
        ]),
        hover_element ? renderTooltip(hover_element) : null
      ])
    ])
  })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$) 
  return {
    output$: state$
      .distinctUntilChanged((x, y) => x.click_element === y.click_element)
      .filter(x => !!x.click_element)
      .map(x => {
        const element = x.click_element
        const date = moment(new Date(element.getAttribute(`data-date`)))
        const bucket = x.buckets[date.date()]
        return{
          date,
          check_ins: bucket
        }
      }),
    DOM: vtree$
  }
}
