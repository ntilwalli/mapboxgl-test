import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import deepEqual = require('deep-equal')
import {combineObj, createProxy, blankComponentUndefinedDOM} from '../../../../../utils'
import {BlankStructuredUndefined, CostTypeComboBox, PurchaseTypeComboBox, FloatInputComponent, NumberInputComponent} from '../helpers'
import {CostOptions, TierPerkOptions} from '../../helpers'
import TierPerk from '../tierPerk/main'
import clone = require('clone')

export function getDefault() {
  return {
    type: CostOptions.COVER,
    data: {
      cover: 5
    },
    benefit: {
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
    CostOptions.COVER
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

  const perk_component = TierPerk(sources, {...inputs, props$: shared$.pluck('benefit')})


  const vtree$ = combineObj({
      type: type_component.DOM,
      cover: cover_component.DOM, 
      perk: perk_component.DOM
    }).debounceTime(0).map((components: any) => {
      const {type, cover, perk} = components

      return div(`.column`, [
        div(`.row.align-center`, [
          span(`.item`, [type]),
          cover ? span('.item', [cover]) : null,
          cover ? span('.item.align-center', ['dollars']) : null,
          span('.item.align-center', ['for']),
          perk
        ])
      ])       
    })

  const output$ = combineObj({
      type: type_component.output$,
      cover: cover_component.output$, 
      perk: perk_component.output$
    }).debounceTime(0).map((components: any) => {
      const {type, cover, perk} = components
      const errors = cover.errors.concat(perk.errors)
      const valid = !!(cover.valid && perk.valid)

      return {
        data: {
          type,
          data: cover.data,
          perk: perk.data
        },
        valid,
        errors
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