import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, em, span, input} from '@cycle/dom'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, blankComponentUndefinedDOM} from '../../../../../utils'
import {StyledComboBox, BlankStructuredUndefined, ComboBox, CostTypeComboBox, PurchaseTypeComboBox, FloatInputComponent, NumberInputComponent} from '../helpers'
import {CostOptions, PurchaseTypeOptions} from '../../../../../listingTypes'
import clone = require('clone')


export function minimumPurchaseDefault() {
  return {
    type: PurchaseTypeOptions.DRINK,
    data: 1
  }
}

export function MinimumPurchaseComponent(sources, props$, component_id) {
  const shared$ = props$
    .map(x => x || minimumPurchaseDefault())
    .publishReplay(1).refCount()
  const number_input = NumberInputComponent(sources, props$.map(x => x.data.toString()), 'Minimum purchase')
  const p_opts = PurchaseTypeOptions
  const options = [
    PurchaseTypeOptions.DRINK,
    PurchaseTypeOptions.ITEM,
    //p_opts.DRINK_OR_ITEM,
    PurchaseTypeOptions.DOLLARS
  ]
  const type_input = isolate(StyledComboBox)(sources, options, props$.map(x => x.type), '.purchase_type_combo_box')

  const vtree$ = combineObj({
    number: number_input.DOM,
    type: type_input.DOM
  }).map((components: any) => {
    const {number, type} = components
    return div('.d-fx-a-c', [
      number,
      div('.ml-xs', [type])
    ])
  })

  const output$ = combineObj({
    data: number_input.output$,
    type: type_input.output$
  }).map((info: any) => {
    const {data, type} = info
    const valid = !! data.valid
    const errors: string[] = data.errors
    return {
      data: {
        data: data.data,
        type
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

export function costPerMinuteDefault() {
  return {
    cost: 1,
    max: 10
  }
}

export function CostPerMinuteComponent(sources, props$, component_id) {
  const shared$ = props$
    .map(x => x || costPerMinuteDefault())
    .publishReplay(1).refCount()
  const cost_input = NumberInputComponent(sources, props$.map(x => x.cost.toString()), component_id)
  const max_input = NumberInputComponent(sources, props$.map(x => x.max.toString()), component_id)

  const vtree$ = combineObj({
    cost: cost_input.DOM,
    max: max_input.DOM
  }).map((components: any) => {
    const {cost, max} = components
    return div('.row', [
      span('.item', [cost]),
      span('.item', ['dollars per minute, max:']),
      span('.item', [max])
    ])
  })

  const output$ = combineObj({
    cost: cost_input.output$,
    max: max_input.output$
  }).map((info: any) => {
    const {data, type} = info
    const valid = !! data.valid
    const errors: string[] = data.errors
    return {
      data: {
        data: data.data,
        type
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


export function getDefault() {
  return {
    type: CostOptions.FREE,
    data: undefined
  }
}

const toDefault = type => {
  switch (type) {
    case CostOptions.FREE:
    case CostOptions.SEE_NOTE:
      return {
        type
      }
    case CostOptions.COVER_AND_MINIMUM_PURCHASE:
    case CostOptions.COVER_OR_MINIMUM_PURCHASE:
      return {
        type,
        data: {
          cover: 5,
          minimum_purchase: minimumPurchaseDefault()
        }
      }
    case CostOptions.COVER:
      return {
        type,
        data: {
          cover: 5
        }
      }
    case CostOptions.MINIMUM_PURCHASE:
      return {
        type,
        data: {
          minimum_purchase: minimumPurchaseDefault()
        }
      }
    case CostOptions.COST_PER_MINUTE:
      return {
        type,
        data: {
          cost_per_minute: costPerMinuteDefault()
        }
      }
    default: 
      throw new Error()
  }
}

export default function main(sources, inputs) {
  const shared$ = inputs.props$
    .map(x => {
      return x || getDefault()
    })
    .publishReplay(1).refCount()

  const component_id = 'Cost'

  const options = inputs.options || [
    CostOptions.FREE,
    CostOptions.COVER,
    CostOptions.MINIMUM_PURCHASE,
    CostOptions.COVER_AND_MINIMUM_PURCHASE,
    CostOptions.COVER_OR_MINIMUM_PURCHASE,
    //CostOptions.COST_PER_MINUTE,
    CostOptions.SEE_NOTE
  ]

  const type_component = isolate(StyledComboBox)(sources, options, shared$.pluck('type').take(1), '.fx-half-width')
  const type$ = type_component.output$.publishReplay(1).refCount() 
  const props$ = O.merge(shared$, type$.skip(1).map(toDefault)).publishReplay(1).refCount()

  const cover_component$ = props$
    .map((props: any) => {
      //const data: any = props.data
      switch (props.type) {
        case CostOptions.COVER_AND_MINIMUM_PURCHASE:
        case CostOptions.COVER_OR_MINIMUM_PURCHASE:
        case CostOptions.COVER:
          return  FloatInputComponent(
            sources, 
            O.of(props.data.cover ? props.data.cover.toString() : "5"),
            component_id + ': Invalid number'
          )
        default: 
          return BlankStructuredUndefined()
      }
    }).publishReplay(1).refCount()

  const cover_component = {
    DOM: cover_component$.switchMap(x => x.DOM),
    output$: cover_component$.switchMap(x => x.output$)
  }


  const minimum_purchase_component$ = props$
    .map((props: any) => {
      switch (props.type) {
        case CostOptions.COVER_AND_MINIMUM_PURCHASE:
        case CostOptions.COVER_OR_MINIMUM_PURCHASE:
        case CostOptions.MINIMUM_PURCHASE:
          return  MinimumPurchaseComponent(
            sources, 
            O.of(props.data.minimum_purchase), 
            component_id + ': Invalid number'
          )
        default: 
          return BlankStructuredUndefined()
      }
    }).publishReplay(1).refCount()

  const minimum_purchase_component = {
    DOM: minimum_purchase_component$.switchMap(x => x.DOM),
    output$: minimum_purchase_component$.switchMap(x => x.output$)
  }

  const cost_per_minute_component$ = props$
    .map((props: any) => {
      switch (props.type) {
        case CostOptions.COST_PER_MINUTE:
          return CostPerMinuteComponent(
            sources, 
            O.of(props.data.cost_per_minute), 
            component_id
          )
        default: 
          return BlankStructuredUndefined()
      }
    }).publishReplay(1).refCount()

  const cost_per_minute_component = {
    DOM: cost_per_minute_component$.switchMap(x => x.DOM),
    output$: cost_per_minute_component$.switchMap(x => x.output$)
  }

  const vtree$ = combineObj({
      type: type_component.DOM,
      cover: cover_component.DOM, 
      minimum_purchase: minimum_purchase_component.DOM,
      cost_per_minute: cost_per_minute_component.DOM
    }).debounceTime(0).map((components: any) => {
      const {type, cover, minimum_purchase, cost_per_minute} = components
      const both = cover && minimum_purchase
      const line_type = inputs.heading_text ? '.input-line' : '.raw-line'
      return div('.row', [
        div('.col-12', [
          div('.row', [
            div('.col-12' + line_type, [
              inputs.heading_text ? div('.heading', [inputs.heading_text]) : null,
              div('.content.fx-wrap', [
                div('.d-fx-a-c.fx-auto-width', {class: {'mb-xs': cover || minimum_purchase || cost_per_minute}}, [type]),
                !both && cover ? span('.d-fx-a-c.ml-xs.mb-xs', [
                  cover,
                  span('.ml-xs', ['dollars'])
                ]) : null,
                !both && minimum_purchase ? span('.ml-xs.d-fx-a-c.mb-xs', [
                  minimum_purchase
                ]) : null
              ]),
            ])
          ]),
          both ? div('.row', [
            div('.col-12', [
              div('.row', [
                div('.col-12.raw-line.fx-auto-width.fx-wrap', [
                  em('.mr-4', ['Cover']),
                  div('.d-fx-a-c', [
                    cover,
                    'dollars'
                  ])
                ])
              ]),
              div('.row', [
                div('.col-12.raw-line.fx-auto-width.fx-wrap', [
                  em('.mr-4', ['Minimum purchase']),
                  minimum_purchase
                ])
              ])
            ])
          ]) : null,
          cost_per_minute ? div('.row', [
            span('.col-12', [cost_per_minute]),
          ]) : null
        ])
      ])  
    })

  const output$ = combineObj({
      type: type_component.output$,
      cover: cover_component.output$, 
      minimum_purchase: minimum_purchase_component.output$,
      cost_per_minute: cost_per_minute_component.output$
    }).debounceTime(0).map((components: any) => {
      const {type, cover, minimum_purchase, cost_per_minute} = components
      const errors = cover.errors.concat(minimum_purchase.errors).concat(cost_per_minute.errors)
      const valid = cover.valid && minimum_purchase.valid && cost_per_minute.valid

      const blank = undefined
      const data = type === CostOptions.SEE_NOTE ? blank :
                   type === CostOptions.FREE ? blank :
                   type === CostOptions.COVER ? { cover: cover.data } :
                   type === CostOptions.MINIMUM_PURCHASE ? { minimum_purchase: minimum_purchase.data } :
                   type === CostOptions.COST_PER_MINUTE ? { cost_per_minute: cost_per_minute.data } :
                   {cover: cover.data, minimum_purchase: minimum_purchase.data}

      return {
        data: {
          type,
          data: data
        },
        valid,
        errors
      }
    })

  return {
    DOM: vtree$,
    output$: output$.map(x => {
      if (inputs.component_index > -1) {
        return {
          data: x,
          index: inputs.component_index
        }
      } else {
        return x
      }
    })
  }
}