import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, button, img, span, i, a} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify} from '../../utils'

function getListingLine(listing) {
  const {type, parent_id, cuando, meta} = listing
  if (type === 'single' && !parent_id)
    return meta.name + '/' + cuando.begins.format('lll')
  else if (type === 'single')
    return cuando.begins.format('lll')
  else
    return meta.name
}

function intent(sources) {
  const {DOM} = sources
  const switch$ = DOM.select('.appTreeSwitch').events('click')
  const edit$ = DOM.select('.appEditListing').events('click')
    .map(ev => ev.target.listing)

  const go_to_listing$ = DOM.select('.appGoToListing').events('click')
    .map(ev => ev.target.listing)

  return {
    switch$,
    edit$,
    go_to_listing$
  }
}

function reducers(actions, inputs) {
  const switch_r = actions.switch$.map(x => state => {
    return state.update('open', x => !x)
  })
  
  return switch_r
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.props$
    .map(props => {
      return {
        open: props.open,
        listing: props.listing
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


function view(state$, children$) {
  return combineObj({
      state$,
      children$
    }).map((info: any) => {
      const {state, children} = info
      const {open, listing} = state
      const has_children = children && children.length
      const out =  div('.row', [
        listing ? div('.col-xs-12', [
          div('.row', [
            div('.col-xs-6.hover-bg-verylightgray', [
              has_children ? span('.appTreeSwitch.tree-switch.btn.btn-link.fa.mr-1', {class: {
                "fa-minus-square": !!open,
                "fa-plus-square": !open
              }}, []) : null,
              button('.appGoToListing.btn.btn-link', {props: {listing}}, [getListingLine(listing)]),
              span('.float-xs-right.appEditListing.btn.btn-link.fa.fa-gear', {props: {listing}}, [])
            ])
          ]),
          has_children && open ? div('.row', [
            div('.col-xs-11.push-xs-1', 
              children
            )
          ]) : null
        ]) : null
      ])

      return out
    })
}

export default function main(sources, inputs) {
  const shared$ = inputs.props$.publishReplay(1).refCount()
  const actions = intent(sources)
  const state$ = model(actions, {...inputs})
  const children$ = shared$.pluck('children').map(x => x && x.length ? x : undefined)
    .map(children => {
      if (children && children.length) {
        const items = children.map(x => {
          return isolate(main)(sources, {...inputs, props$: O.of({listing: x, children: []})})
        })
        const merged = mergeSinks(...items)
        return {
          ...merged,
          DOM: O.combineLatest(...items.map(x => x.DOM)).do(x => {
              console.log('children DOM', x)
            })
        }
      } else {
        return {
          DOM: O.of(undefined)
        }
      }
    }).publishReplay(1).refCount()

  const children = componentify(children$)
  const children_dom = children.DOM.do(x => {
    console.log('children DOM', x)
  })
  const vtree$ = view(state$, children_dom)

  return {
    ...children,
    DOM: vtree$,
    Router: O.merge(
      children.Router,
      actions.edit$.map(x => `/listing/${x.id}`),
      actions.go_to_listing$.map(x => `/listing/${x.id}`)
    )
  }
}