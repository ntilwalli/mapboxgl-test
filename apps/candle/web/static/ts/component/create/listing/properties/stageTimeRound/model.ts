import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {combineObj} from '../../../../../utils'
import deepEqual = require('deep-equal')
import {StageTimeOptions, MinutesTypeOptions} from '../../helpers'
import clone = require('clone')

function getDefault() {
  return {
    type: StageTimeOptions.MINUTES
    data: {
      type: MinutesTypeOptions.MAX,
      data: {
        max: 5
      }
    }
  }
}

function reducers(actions, inputs) {

  const type_input_r = actions.add_round$.map(msg => state => {

    return state.update(`stage_time`, performer_cost => {
      performer_cost.type = msg
      switch (msg) {
        case CostOptions.COVER:
          performer_cost.data = {
            cover: 5
          }
          break
        case CostOptions.MINUMUM_PURCHASE:
          performer_cost.data = {
            minimum_purchase: {
              type: PurchaseTypeOptions.DRINK,
              data: 1
            }
          }
          break
        case CostOptions.COVER_AND_MINIMUM_PURCHASE:
        case CostOptions.COVER_OR_MINIMUM_PURCHASE:
          performer_cost.data = {
            cover: 5,
            minimum_purchase: {
              type: PurchaseTypeOptions.DRINK,
              data: 1
            }
          }
          break;
        default:
          performer_cost.data = undefined
          break
      }

      return performer_cost
    })
  })

  const cover_input_r = inputs.cover_input$.map(msg => state => {
    //console.log('in person input msg', msg)
    return state.update('errors_map', errors_map => {
      errors_map['cover-input'] = msg.errors
      return errors_map
    }).update(`performer_cost`, performer_cost => {
      if (msg.valid) {
        performer_cost.data.cover = msg.value
      } else {
        performer_cost.data.cover = undefined
      }

      return performer_cost
    })
  })

  const minimum_purchase_input_r = inputs.minimum_purchase_input$.map(msg => state => {
    //console.log('in person input msg', msg)
    return state.update('errors_map', errors_map => {
      errors_map['minimum-purchase-input'] = msg.errors
      return errors_map
    }).update(`performer_cost`, performer_cost => {
      if (msg.valid) {
        performer_cost.data.minimum_purchase = msg.value
      } else {
        performer_cost.data.minimum_purchase = undefined
      }

      return performer_cost
    })
  })

  return O.merge(O.never())
}

export default function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return inputs.props$.take(1)
    .switchMap(props => {
      const init = {
        performer_cost: props || [getDefault()],
        errors_map: {}
      }

      return reducer$.startWith(Immutable.fromJS(init)).scan((acc, f: Function) => f(acc))
    })
    .debounceTime(0)
    .map((x: any) => clone(x.toJS()))
    //.do(x => console.log(`cost state`, x))
    .publishReplay(1).refCount()
}