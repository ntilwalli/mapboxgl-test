import {Observable as O} from 'rxjs'
import Immutable = require('immutable')
import {div, em, ul, li, strong, button, img, span, i, a} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify} from '../../../utils'
import ComboBox from '../../../library/comboBox'
import {RecurrenceDisplayFilterOptions} from '../../../listingTypes'
import moment = require('moment')

import {
  renderName, renderNameWithParentLink, renderCuando, renderDonde, 
  renderCuandoStatus, renderCost, renderStageTime, renderPerformerSignup,
  renderPerformerLimit, renderTextList, renderNote, getFullCostAndStageTime,
  renderContactInfo, getFreqSummary, getDateTimeString, getCuandoStatus,
  getDondeNameString, getDondeCityString, getDondeStateString
}  from '../../helpers/listing/renderBootstrap'

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

  const filter_type_r = inputs.filter_type$.map(val => state => {
    return state.set('filter_type', val)
  })
  
  return O.merge(switch_r, filter_type_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  
  return inputs.props$
    .map(props => {
      return {
        open: props.open,
        listing: props.listing,
        children: props.children,
        filter_type: RecurrenceDisplayFilterOptions.NEXT_30_DAYS,
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

function renderRightAligned(val) {
  return span('.d-flex.fx-j-e', [val])
}

function renderLeftAligned(val) {
  return span('.d-flex', [val])
}

function renderCuandoRecurringInfo(listing) {
  return div('.row', [
    div('.col-12.d-flex.flex-column', [
      renderRightAligned(span('.tag.tag-success', ['Recurring'])),
      renderRightAligned(getFreqSummary(listing.cuando.rrules)),
      renderRightAligned(listing.cuando.rrules[0].dtstart.format('h:mm a'))
    ])
  ])
}

function renderCuandoSingleInfo(listing) {
  return div('.row', [
    div('.col-12.d-flex.fx-j-e.flex-column', [
      renderRightAligned(getCuandoStatus(listing.cuando)),
      renderRightAligned(getDateTimeString(listing.cuando.begins))
    ])
  ])
}

function renderListing(listing) {
  const {type, donde, cuando, meta} = listing
  return div('.appGoToListing.card-block.hover-bg-verylightgray', {props: {listing}}, [
    div('.row', [
      div('.col-6.d-flex.flex-column', [
        strong([meta.name]),
        em([getDondeNameString(donde)]),
        getDondeCityString(donde) + ', ' + getDondeStateString(donde)
      ]),
      div('.col-6', [
        type === 'single' ? renderCuandoSingleInfo(listing) : renderCuandoRecurringInfo(listing)
      ])
    ])
  ])
}

function getFilter(type) {
  switch (type) {
    case RecurrenceDisplayFilterOptions.NEXT_30_DAYS: 
      return listing => {
        return (
          listing.cuando.begins.isSameOrBefore(moment().add(30, 'day')) &&
          listing.cuando.begins.isSameOrAfter(moment())
        )
      }
    case RecurrenceDisplayFilterOptions.LAST_30_DAYS: 
      return listing => {
        return (
          listing.cuando.begins.isSameOrAfter(moment().subtract(30, 'day')) &&
          listing.cuando.begins.isSameOrBefore(moment())
        )
      }
    case RecurrenceDisplayFilterOptions.ALL_PAST: 
      return listing => {
        return listing.cuando.begins.isSameOrBefore(moment())
      }
    case RecurrenceDisplayFilterOptions.ALL_FUTURE: 
      return listing => {
        return listing.cuando.begins.isSameOrAfter(moment())
      }
    default:
      return listing => true
  } 
}

function renderChildren(info) {
  const {state} = info
  const {filter_type, children} = state
  const filter_func = getFilter(filter_type)
  const filtered = children.filter(filter_func).sort((x, y) => x.cuando.begins - y.cuando.begins)
  return ul('.list-unstyled.recurrences.mt-xs.mb-0', filtered.map(listing => {
    return li('.appGoToListing.hover-bg-verylightgray.d-flex.fx-j-sb', {props: {listing}}, [
      span([listing.meta.name]), 
      span([listing.cuando.begins.format('D MMM YYYY')])
    ])
  }))
}

function renderRecurrences(info) {

  return div('.card-block', [
    div('.row', [
      div('.col-5', [strong([em(['Recurrences'])])]),
      div('.col-7', [info.components.filter_type])
    ]),
    div('.row', [
      div('.col-12', [
        renderChildren(info)
      ])
    ])
  ])
}


function view(state$, components) {
  return combineObj({
      state$,
      components: combineObj(components)
    }).map((info: any) => {
      const {state} = info
      const {open, listing, children} = state
      const has_children = children && children.length
      const out =  div('.card', [
        //div('.card-block', [
          //div('.row', [
            // div('.col-6.hover-bg-verylightgray', [
            //   has_children ? span('.appTreeSwitch.tree-switch.btn.btn-link.fa.mr-4', {class: {
            //     "fa-minus-square": !!open,
            //     "fa-plus-square": !open
            //   }}, []) : null,
              // button('.appGoToListing.btn.btn-link', {props: {listing}}, [getListingLine(listing)]),
              renderListing(listing),
            //   span('.d-flex.justify-content-end.appEditListing.btn.btn-link.fa.fa-gear', {props: {listing}}, [])
            // ])
          //]),
          // has_children && open ? div('.card-block', [
          //   div('.col-11.push-xs-1', 
          //     children
          //   )
          // ]) : null
          has_children ? renderRecurrences(info) : null
        //])
      ])

      return out
    })
}

export default function main(sources, inputs) {
  const shared$ = inputs.props$.publishReplay(1).refCount()
  const actions = intent(sources)
  const options = [
    RecurrenceDisplayFilterOptions.ALL_PAST,
    RecurrenceDisplayFilterOptions.LAST_30_DAYS,
    RecurrenceDisplayFilterOptions.NEXT_30_DAYS,
    RecurrenceDisplayFilterOptions.ALL_FUTURE,
    RecurrenceDisplayFilterOptions.ALL
  ]

  const filter_type_combo = isolate(ComboBox)(sources, options, O.of(RecurrenceDisplayFilterOptions.NEXT_30_DAYS), '.recurrence-filter-combo-box')

  const state$ = model(actions, {...inputs, filter_type$: filter_type_combo.output$})

  // const children$ = shared$.pluck('children').map(x => x && x.length ? x : undefined)
  //   .map(children => {
  //     if (children && children.length) {
  //       const now = moment()
  //       const items = children.sort((x, y) => x.cuando.begins - y.cuando.begins).filter(x => x.cuando.begins > now)
  //       const sorted = items.map(x => {
  //           return isolate(main)(sources, {...inputs, props$: O.of({listing: x, children: []})})
  //         })

  //       const merged = mergeSinks(...sorted)
  //       return {
  //         ...merged,
  //         DOM: O.combineLatest(...sorted.map(x => x.DOM)).do(x => {
  //             console.log('children DOM', x)
  //           })
  //       }
  //     } else {
  //       return {
  //         DOM: O.of(undefined)
  //       }
  //     }
  //   }).publishReplay(1).refCount()

  // const children = componentify(children$)
  // const children_dom = children.DOM.do(x => {
  //   console.log('children DOM', x)
  // })

  const components = {
    filter_type: filter_type_combo.DOM
  }
  const vtree$ = view(state$, components)
  const merged = mergeSinks(filter_type_combo)
  return {
    ...merged,
    DOM: vtree$,
    Router: O.merge(
      merged.Router,
      actions.edit$.map(x => '/listing/' + x.id),
      actions.go_to_listing$.map(x => '/listing/' + x.id)
    ),
    errors$: O.never()
  }
}