import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, img} from '@cycle/dom'
import {combineObj} from '../../../utils'

function intent(sources) {
  const {DOM} = sources

  return {

  }
}

function reducers(actions, inputs) {
  return O.merge(O.never())
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      selected$: inputs.props$ || O.of(undefined),
      authorization$: inputs.Authorization.status$
    })
    .switchMap((info: any) => {
      const init = info

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function renderInfo(state) {
  return div('.media.mb-4', [
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
          div('.col-12', [state.authorization.name])
        ]),
        div('.row', [
          div('.col-12', ['@' + state.authorization.username])
        ])
      ])
    ])
}

function view(state$) {
  return state$.map(state => {
    return div('.user-profile.container.nav-fixed-offset.mt-4', [
      renderInfo(state)
    ])
  })
}

export default function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$)
  return {
    DOM: vtree$
  }
}