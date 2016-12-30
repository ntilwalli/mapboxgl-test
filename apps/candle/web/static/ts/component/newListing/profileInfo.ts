import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a} from '@cycle/dom'
import {combineObj} from '../../utils'

function reducers(actions, inputs) {
  return O.never()
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.Authorization.status$
    .map(authorization => {
      return {
        authorization
      }
    })
    .map(x => Immutable.Map(x))
    .switchMap(init => {
      return reducer$
        .startWith(init)
        .scan((acc, f: Function) => f(acc))
    })
    .map(x => x.toJS())
    //.do(x => console.log(`home/profile state`, x))
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    const {authorization} = state
    return div('.media.mb-1', [
      div ('.media-left', [
        img({
          attrs: {
            src: '/images/profile_pic_placeholder.png', 
            height: '100px', 
            width: '81px'
          }, style: {
            height: "100px",
            width: "81px"
          }
        })
      ]),
      div('.media-body', [
        div('.row', [
          div('.col-xs-12', [authorization.name])
        ]),
        div('.row', [
          div('.col-xs-12', ['@' + authorization.username])
        ])
      ])
    ])
  })
}

export default function main(sources, inputs) {
  const state$ = model({}, inputs) 
  const vtree$ = view(state$)

  return {
    DOM: vtree$
  }
}