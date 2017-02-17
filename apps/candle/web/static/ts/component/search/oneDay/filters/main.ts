import {Observable as O} from 'rxjs'
import {div, input, span, h4} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, normalizeSink, spread, mergeSinks, createProxy, componentify, traceStartStop} from '../../../../utils'
import SmartTextInput from '../../../../library/smartTextInput'
import {getDefaultFilters} from '../helpers'
import EventTypesAndCategories from '../../../../component/create/newListing/basics/eventTypesAndCategories'
import ComboBox from '../../../../library/comboBox'
import {findEventTypeOpenMic} from '../../../../component/helpers/listing/utils'
import RegionSelector from '../../../../library/bootstrapRegionSelector'

function BlankComponent() {
  return {
    DOM: O.of(undefined),
    output$: O.of([])
  }
}

function intent(sources) {
  const {DOM} = sources

  return {}
}

function unique(value, index, self) {
  return self.indexOf(value) === index
}

function updateStateArray(state, prop, flag, value) {
  if (flag) {
    return state.update(prop, x => x.concat([value]).filter(unique))
  } else {
    return state.update(prop, x => x.filter(x => x !== value))
  }
}

function reducers(actions, inputs) {
  const event_types_and_categories_r = inputs.event_types_and_categories$
    .map(val => state => {
      return state.set(`event_types`, val.event_types).set('categories', val.categories)
    })

  const performer_cost_r = inputs.performer_cost$
    .map(val => state => {
      return state.set(`performer_costs`, val)
    })

  const search_region_r = inputs.search_region$
    .map(val => state => {
      return state.set('search_region', val)
    })

  return O.merge(event_types_and_categories_r, performer_cost_r, search_region_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  const props$ = inputs.props$
  return props$
    .map(props => {
      //console.log(`filter props:`, props)
      return Immutable.Map(props)
    })
    .switchMap(init => {
      //console.log(`reset filters model`)
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`filters state:`, x))
    //.letBind(traceStartStop())
    .publishReplay(1).refCount()
}

function view(state$, components) {
  return combineObj({state$, components$: combineObj(components)})
    .debounceTime(0)
    .map((info: any) => {
      const {state, components} = info
      return div(`.filters-dialog`, {style: {width: '100%'}}, [
        div('.mb-4', [
          h4(['Search region']),
          components.search_region
        ]),
        components.event_types_and_categories,
        components.performer_cost ? div('.mt-4', [
          h4(['Performer cost']),
          components.performer_cost
        ]) : null
      ])
    })
}

function main(sources, inputs) {
  const props$ = inputs.props$ ? inputs.props$.take(1) : O.of(getDefaultFilters())
  const categories$ = inputs.props$.pluck('categories')
  const event_types$ = inputs.props$.pluck('event_types')
  const search_region$ = inputs.props$.pluck('search_region')
  const region_selector = isolate(RegionSelector)(sources, {...inputs, props$: search_region$})
  const event_types_and_categories = EventTypesAndCategories(sources, {...inputs, categories$, event_types$})
  const performer_cost$ = event_types_and_categories.output$
    .pluck('event_types')
    .map((arr: any) => {
      if (findEventTypeOpenMic(arr)) {
        const options = [
          'all', 'free', 'paid'   
        ]
        
        const performer_cost = isolate(ComboBox)(
          sources, 
          options, 
          inputs.props$.pluck('performer_costs')
            .map(arr => {
              if (arr && arr.length === 1) {
                if (arr.length === 1) {
                  return arr[0]
                }

                return 'all'
              } else {
                return 'all'
              }
            })
        )

        return performer_cost
      } else {
        return BlankComponent()
      }
    })
    .publishReplay(1).refCount()
  
  const raw_performer_cost: any = componentify(performer_cost$, 'output$')
  const performer_cost = {
    ...raw_performer_cost,
    output$: raw_performer_cost.output$
      .map(x => {
        if (x === 'all') {
          return ['free', 'paid']
        } else {
          return [x]
        }
      })
  }

  const actions = intent(sources)

  const state$ = model(actions, {
    props$, 
    event_types_and_categories$: event_types_and_categories.output$.skip(1),
    performer_cost$: performer_cost.output$,
    search_region$: region_selector.output$
  })

  const components = {
    event_types_and_categories$: event_types_and_categories.DOM,
    performer_cost$: performer_cost.DOM,
    search_region$: region_selector.DOM
  }

  const vtree$ = view(state$, components)
  const merged = mergeSinks(event_types_and_categories, performer_cost, region_selector)
  return {
    ...merged,
    DOM: vtree$,
    output$: state$
  }
}

export default main