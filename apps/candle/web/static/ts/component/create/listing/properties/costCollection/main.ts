import {Observable as O} from 'rxjs'
import {div, span, h6, button} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, createProxy} from '../../../../../utils'
import clone = require('clone')
import {CostOptions, TierPerkOptions, UndefinedOption} from '../../../../../listingTypes'
import {default as Cost, getDefault as getCostDefault} from '../cost/main'
//import {default as TierCost, getDefault as getTierCostDefault} from '../tierCost/main'
import {default as FullTierCost, getDefault as getFullTierCostDefault} from '../fullTierCost/main'

function render(state, component_id, item_heading) {
  let children
  if (state.length === 0) {
    children = ['Click plus to add item']
  } else if (state.length === 1) {
    children = state
  } else {
    children = state.map((x, index) => {
      const margin_class = index !== state.length - 1 ? '.mb-1' : ''
      return div('.row' + margin_class, [
        div('.col-xs-12', [
          div('.row', [
            div('.col-xs-12.raw-line.mb-xs.fx-auto-width', [
              span('.d-fx-a-c.mr-1', [`${item_heading} ${index + 1}`]),
              span('.appCostCollectionSubtractButton.fa.fa-minus.plus-button.btn.btn-link', {attrs: {'data-index': index}}, [])
            ])
          ]),
          x
        ])
      ])
    })
  }

  return div('.card.card-block', [
    div('.card-title.d-fx-a-c', [
      h6('.mb-0.mr-1', [component_id]),
      button('.appCostCollectionAddButton.fa.fa-plus.plus-button.btn.btn-link', [])
    ]),
  ].concat(children))
}

function intent(sources) {
  const {DOM} = sources

  return {
    add$: DOM.select('.appCostCollectionAddButton').events('click'),
    subtract$: DOM.select('.appCostCollectionSubtractButton').events('click').map(ev => {
      return parseInt(ev.target.dataset['index'])
    })
  }
}

function add_structure(x) {
  return {
    data: x,
    errors: [],
    valid: true
  }
}

function reducers(actions, inputs) {
  const add_r = actions.add$.map(_ => state => {
    let new_state = state
    if (state.size === 1) {
      const x = new_state.toJS()
      const item = x[0]

      const transferrable_cost_type = item.data.type !== CostOptions.COVER_OR_MINIMUM_PURCHASE
      if (transferrable_cost_type) {
        item.data['perk'] = undefined
        new_state = new_state.set(0, Immutable.fromJS(item))
      } else {
        new_state = state.set(0, Immutable.fromJS(add_structure(getFullTierCostDefault())))
      }
    }

    return new_state.push(Immutable.fromJS(add_structure(getFullTierCostDefault())))
  })

  const subtract_r = actions.subtract$.map(index => state => {
    const new_state = state.delete(index)
    if (new_state.size === 1) {
      const x = new_state.toJS()
      const item = x[0]
      delete(item.data.perk)

      return new_state.set(0, Immutable.fromJS(item))
      //return new_state.set(0, Immutable.fromJS(add_structure(getCostDefault())))
    }

    return new_state
  })

  const change_r = inputs.change$.map(msg => state => {
    const out = state.set(msg.index, Immutable.fromJS(msg.data))
    return out
  })

  return O.merge(add_r, subtract_r, change_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(props => {
      // should be
      const init = props ? props.map(add_structure) : [getFullTierCostDefault()].map(add_structure)//[getDefault()]

      return reducer$.startWith(Immutable.fromJS(init)).scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    //.do(x => console.log(`costCollection state`, x))
    .publishReplay(1).refCount()
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const change$ = createProxy()
  const state$ = model(actions, {...inputs, change$})

  const components$ = state$
    .distinctUntilChanged((x, y) => x.length === y.length)
    .map(state => {
      let cost_options, perk_options, heading_text

      if (state.length === 1) {
        cost_options = [
          CostOptions.FREE,
          CostOptions.COVER,
          CostOptions.MINIMUM_PURCHASE,
          CostOptions.COVER_AND_MINIMUM_PURCHASE,
          CostOptions.COVER_OR_MINIMUM_PURCHASE,
          CostOptions.SEE_NOTE
        ]

        perk_options = [
          UndefinedOption,
          TierPerkOptions.DRINK_TICKET
        ]

        heading_text = "Perk?"
      } else {
        cost_options = [
          CostOptions.FREE,
          CostOptions.COVER,
          CostOptions.MINIMUM_PURCHASE,
          CostOptions.COVER_AND_MINIMUM_PURCHASE,
          CostOptions.SEE_NOTE
        ]

        perk_options = [
          UndefinedOption,
          TierPerkOptions.MINUTES,
          TierPerkOptions.SONGS,
          TierPerkOptions.PRIORITY_ORDER,
          TierPerkOptions.ADDITIONAL_BUCKET_ENTRY,
          TierPerkOptions.MINUTES_AND_PRIORITY_ORDER,
          TierPerkOptions.SONGS_AND_PRIORITY_ORDER
        ]

        heading_text = "Perk?"
      }

      //const state = JSON.parse(JSON.stringify(my_state));
      const components = state.map((props, index) => {
        return isolate(FullTierCost)(sources, {...inputs, heading_text, cost_options, perk_options, props$: O.of(props.data), component_index: index})
      })
      
      const components_dom = components.map(x => x.DOM)
      const components_output = components.map(x => x.output$)

      return {
        DOM: O.combineLatest(...components_dom),
        output$: O.merge(...components_output)
      }
    }).publishReplay(1).refCount()

  const components_dom$ = components$.switchMap(x => x.DOM)
  const components_output$ = components$.switchMap(x => x.output$)

  change$.attach(components_output$)

  const vtree$ = components_dom$.map(x => render(x, inputs.component_id, inputs.item_heading))

  return {
    DOM: vtree$,
    output$: state$.map(state => {
      return {
        data: state.map(x => x.data),
        valid: state.every(x => x.valid === true),
        errors: state.reduce((acc, item) => acc.concat(item.errors), [])
      }
    })
  }
}
