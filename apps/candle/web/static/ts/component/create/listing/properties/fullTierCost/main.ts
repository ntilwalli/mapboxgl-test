import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import {combineObj} from '../../../../../utils'
import {CostOptions} from '../../helpers'
import {default as Cost, getDefault as costDefault} from '../cost/main'
import {default as TierPerk, getDefault as tierPerkDefault} from '../tierPerk/main'

export function getDefault() {
  return {
    ...costDefault(),
    perk: tierPerkDefault()
  }
}


export default function main(sources, inputs) {
  const shared$ = inputs.props$
    .map(x => {
      return x || getDefault()
    })
    .publishReplay(1).refCount()

  const cost_options = inputs.cost_options || [
    CostOptions.FREE,
    CostOptions.COVER,
    CostOptions.MINIMUM_PURCHASE,
    CostOptions.COVER_AND_MINIMUM_PURCHASE
  ]


  const cost = Cost(sources, {inputs, options: cost_options, props$: shared$})
  const perk = TierPerk(sources, {...inputs, options: inputs.perk_options, props$: shared$.pluck('perk')})


  const vtree$ = combineObj({
      cost: cost.DOM,
      perk: perk.DOM,
    }).debounceTime(0).map((components: any) => {
      const {cost, perk} = components

      return div(`.column`, [
        cost,
        div('.row', [
          span('.item.flex.align-center.perk', [inputs.heading_text || 'Perk?']),
          perk
        ])
      ])
    })

  const output$ = combineObj({
      cost: cost.output$,
      perk: perk.output$, 
    }).debounceTime(0).map((info: any) => {
      const {cost, perk} = info
      return {
        data: {
          ...cost.data,
          perk: perk.data
        },
        valid: cost.valid && perk.valid,
        errors: cost.errors.concat(perk.errors)
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