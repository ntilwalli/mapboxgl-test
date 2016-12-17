import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, blankComponentUndefinedDOM} from '../../../../../utils'
import {BlankStructuredUndefined, MinimumPurchaseComponent, minimumPurchaseDefault, CostTypeComboBox, PurchaseTypeComboBox, FloatInputComponent, NumberInputComponent} from '../helpers'
import {CostOptions, TierPerkOptions, PurchaseTypeOptions} from '../../../../../listingTypes'
import TierPerk from '../tierPerk/main'
import clone = require('clone')

export function getDefault() {
  return {
    type: CostOptions.COVER,
    data: {
      cover: 5
    },
    perk: {
      type: TierPerkOptions.MINUTES,
      data: 5
    }
  }
}

const toDefault = type => {
  switch (type) {
    case CostOptions.FREE:
      return {
        type
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
    CostOptions.MINIMUM_PURCHASE
  ]

  const type_component = isolate(CostTypeComboBox)(sources, options, shared$.pluck('type').take(1))
  const type$ = type_component.output$.publishReplay(1).refCount() 
  const props$ = O.merge(shared$, type$.skip(1).map(toDefault)).publishReplay(1).refCount()

  const cover_component$ = props$
    .map((props: any) => {
      //const data: any = props.data
      switch (props.type) {
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

  const perk_component = TierPerk(sources, {...inputs, props$: shared$.pluck('perk')})


  const vtree$ = combineObj({
      type: type_component.DOM,
      cover: cover_component.DOM,
      minimum_purchase: minimum_purchase_component.DOM,
      perk: perk_component.DOM
    }).debounceTime(0).map((components: any) => {
      const {type, cover, minimum_purchase, perk} = components

      return div(`.column`, [
        div(`.row.align-center`, [
          span(`.item`, [type]),
          cover ? span('.item', [cover]) : null,
          cover ? span('.item.align-center', ['dollars']) : null,
          minimum_purchase ? span('.item', [minimum_purchase]) : null,
          span('.item.align-center', ['for']),
          perk
        ])
      ])       
    })

  const output$ = combineObj({
      type: type_component.output$,
      cover: cover_component.output$, 
      minimum_purchase: minimum_purchase_component.output$,
      perk: perk_component.output$
    }).debounceTime(0).map((info: any) => {
      const {type, cover, minimum_purchase, perk} = info
      const component = (type === CostOptions.COVER) ? cover :
                        (type === CostOptions.MINIMUM_PURCHASE) ? minimum_purchase :
                        {data: undefined, valid: true, errors: []}
      return {
        data: {
          type,
          data: component.data,
          perk: perk.data
        },
        valid: component.valid,
        errors: component.errors
      }
    })

  return {
    DOM: vtree$,
    output$: output$.map(x => {
      return {
        data: x,
        index: inputs.component_index
      }
    })
  }
}