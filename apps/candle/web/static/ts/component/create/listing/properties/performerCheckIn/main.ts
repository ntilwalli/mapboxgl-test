import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, em, span, input, VNode} from '@cycle/dom'
import {combineObj, createProxy, traceStartStop} from '../../../../../utils'
import {
  RelativeTimeOptions, 
} from '../../../../../listingTypes'
import {
  //DayOfWeekTimeComponent,
  PreRegistrationInfoComponent, 
  ComboBox, 
  RelativeTimeComponent,
  // TimeOptionComponent, 
  // TimeTypeComboBox, 
  BlankUndefined, 
  BlankStructuredUndefined, 
  NumberInputComponent
} from '../helpers'
import clone = require('clone')

interface OutputType {
  data: Object
  errors: string[]
  valid: boolean
}

interface SinksType {
  DOM: O<VNode>
  output$: O<OutputType>
}

export function getDefault() {
  return {
    //radius: 50,
    begins: {
      type: RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
      data: {
        minutes: 15
      }
    },
    ends: {
      type: RelativeTimeOptions.MINUTES_AFTER_EVENT_START,
      data: {
        minutes: 15
      }
    }
  }
}


export default function main(sources, inputs) {
  const component_id = 'Check-in'

  const shared$ = inputs.props$
  .map(x => {
    return x || getDefault()
  })
  .publishReplay(1).refCount()

  const begins_component = NumberInputComponent(sources, shared$.map(props => {
    return props ? props.begins.data.minutes.toString() : undefined
  }), component_id + ' begins: Invalid number')

  const begins_component_normalized = {
    DOM: begins_component.DOM,
    output$: begins_component.output$.map((x: any) => {
      return {
        ...x,
        data: {
          type: RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
          data: {
            minutes: x.data
          }
        }
      }
    })
  }

  const ends_options = [
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_START,
    RelativeTimeOptions.EVENT_START,
    RelativeTimeOptions.MINUTES_AFTER_EVENT_START,
    RelativeTimeOptions.MINUTES_BEFORE_EVENT_END,
    RelativeTimeOptions.EVENT_END
  ]

  const ends_component = RelativeTimeComponent(sources, shared$.pluck('ends'), ends_options, component_id + ' ends', 'Ends', '.sub-sub-heading')

  // const radius_component = NumberInputComponent(
  //   sources, 
  //   shared$.pluck('radius').map(radius => {
  //     return radius ? radius.toString() : undefined
  //   }), component_id + ' radius: Invalid number'
  // )

  const vtree$ = combineObj({
    begins: begins_component_normalized.DOM,
    ends: ends_component.DOM,
    //radius: radius_component.DOM
  }).debounceTime(0).map((components: any) => {
    return div('.row', [
      //div('.sub-heading.section-heading ', ['Check-in']),
      div('.col-12', [
        div('.row.mb-xs', [
          div('.col-12.raw-line.fx-wrap', [
            div('.mr-4', [em(['Begins'])]),
            div('.content.fx-wrap', [
              div('.mr-xs', [components.begins]),
              'minutes before event start'
            ]),
          ])
        ]),
        components.ends
      ])
    ])
  })

  const output$ = combineObj({
    begins: begins_component_normalized.output$,
    ends: ends_component.output$,
    //radius: radius_component.output$
  }).debounceTime(0).map((components: any) => {
    const {begins, ends} = components
    const errors = [].concat(ends.errors).concat(begins.errors)//.concat(radius.errors)
    const valid = !!(ends.valid && begins.valid)// && radius.valid)
    return {
      data: {
        begins: begins.data,
        ends: ends.data
      },
      valid,
      errors
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}