import {Observable as O} from 'rxjs'
import {div, span, input, textarea, label, h6} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'
import {
  ListingTypes, EventTypes, CategoryTypes, 
  EventTypeToProperties
} from '../../../../listingTypes'
import {inflateDates, fromCheckbox} from '../../../helpers/listing/utils'
import clone = require('clone')

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .map(x => x.state.data)
    .map(session => {
      //console.log(`meta session pre`, session)
      session.listing.type = session.listing.type || undefined
      session.listing.meta = session.listing.meta || {
        type: 'standard',
        title: undefined,
        description: undefined,
        short_description: undefined,
        event_types: [],
        categories: []
      }

      return session
    })
    .map(inflateDates)
    .publishReplay(1).refCount()
  
  const type$ = DOM.select('.appTypeInput').events('click')
    .map(ev => ev.target.value)
  const name$ = DOM.select('.appNameInput').events('input')
    .map(ev => ev.target.value)
  const description$ = DOM.select('.appDescriptionInput').events('input')
    .map(ev => ev.target.value)

  const event_type$ = DOM.select('.appEventTypeInput').events('click')
    .map(fromCheckbox)

  const category$ = DOM.select('.appCategoriesInput').events('click')
    .map(fromCheckbox)

  return {
    session$,
    type$,
    name$,
    description$,
    event_type$,
    category$
  }
}

function processCheckboxArray(msg, arr) {
  const {type, data} = msg
  const index = arr.indexOf(msg.value)
  if (index >= 0) {
    arr.splice(index, 1)
  } else {
    arr.push(msg.value)
  }

  return arr
}

function isValid(session) {
  //console.log(`meta valid`, session)
  const {listing} = session
  return listing.type && listing.meta.name && listing.meta.description &&
    listing.meta.event_types.length && listing.meta.categories.length
}

function reducers(actions, inputs) {
  const type_r = actions.type$.map(val => state => {
    return state.update(`session`, session => {
      const {listing, properties} = session
      listing.type = val
      properties.recurrence = undefined
      listing.cuando = undefined
      return session
    })
  })

  const name_r = actions.name$.map(val => state => {
    return state.update('session', session => {
      const {listing} = session
      listing.meta.name = val
      return session
    })
  })

  const description_r = actions.description$.map(val => state => {
    return state.update('session', session => {
      const {listing} = session
      listing.meta.description = val
      return session
    })
  })

  const event_types_r = actions.event_type$.map(msg => state => {
    return state.update('session', session => {
      const {listing} = session
      listing.meta.event_types = processCheckboxArray(msg, listing.meta.event_types)
      
      // HACK since I don't want to figure out how to use ES6 Sets
      // This ensures when checboxes are unchecked the 
      // associated meta properties that may have been set for
      // the associated event type no longer exist in the meta Object
      if (!msg.checked) {
        const type = msg.value
        const meta = listing.meta
        if (meta) {
          const properties = EventTypeToProperties[type]
          const out = {}
          const current_properties = listing.meta.event_types
            .map(x => EventTypeToProperties[x])
            .reduce((acc, val) => acc.concat(val), [])

          // delete all unchecked props
          Object.keys(meta).forEach(prop => {
            if (meta.hasOwnProperty(prop) && 
                properties.every(x => x !== prop)) {
              out[prop] = meta[prop]
            }
          })

          // add back all props assocated with checked event_types that may have been removed
          current_properties.forEach(x => {
            if (meta.hasOwnProperty(x)) {
              out[x] = meta[x]
            }
          })

          session.listing.meta = out
        }
      }

      return session
    })
  })

  const category_r = actions.category$.map(msg => state => {
    return state.update('session', session => {
      //console.log(`category`, val)
      const {listing} = session
      listing.meta.categories = processCheckboxArray(msg, listing.meta.categories)
      return session
    })
  })

  return O.merge(type_r, name_r, description_r, event_types_r, category_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1)
    })
    .switchMap((info: any) => {
      //console.log('meta init', info)
      const session = info.session
      const init = {
        session
      }

      return reducer$
        .startWith(Immutable.Map(init))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .map((x: any) => ({
      ...x,
      valid: isValid(x.session)
    }))
    //.do(x => console.log(`meta state`, x))
    .publishReplay(1).refCount()
}

function has(arr, type) {
  return arr.some(val => val === type)
}

function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {session} = state
      const {listing} = session
      const {type, meta} = listing
      const {name, description, event_types, categories} = meta

      return div(`.row`, [
        div('.col-xs-12', [
          div(`.form-group`, [
            h6('.mb-0', [label('.mr-1', {attrs: {for: 'listingType'}}, ['Listing type'])]),
            //div('.form-check', [
            div([
              label('.form-check-inline', [
                input(`.appTypeInput.form-check-input`, {attrs: {type: 'radio', name: 'listingType', value: ListingTypes.SINGLE, checked: type === ListingTypes.SINGLE}}, []),
                span('.ml-xs', ['Single'])
              ]),
            //]),
            //div('.form-check', [
              label('.form-check-inline', [
                input(`.appTypeInput.form-check-input`, {attrs: {type: 'radio', name: 'listingType', value: ListingTypes.RECURRING, checked: type === ListingTypes.RECURRING}}, []),
                span('.ml-xs', ['Recurring'])
              ])
            //])
            ])
          ]),
          div('.form-group', [
            h6('.mb-0', [label({attrs: {for: 'listingName'}}, ['Name'])]),
            input(`.appNameInput.form-control`, {attrs: {type: 'text', name: 'listingName', value: name || ''}}, [])
          ]),
          div('.form-group', [
            h6('.mb-0', [label({attrs: {for: 'description'}}, ['Description'])]),
            textarea(`.appDescriptionInput.form-control`, {attrs: {name: 'description'}}, [
                description || ''
            ])
          ]),
          div(`.form-group`, [
            h6('.mb-0', [label('.mr-1', {attrs: {for: 'eventTypes'}}, ['Event type'])]),
            //div('.form-check', [
            div([
              label('.form-check-inline', [
                input(`.appEventTypeInput.form-check-input`, {attrs: {type: 'checkbox', name: 'eventTypes', value: EventTypes.OPEN_MIC, checked: has(event_types, EventTypes.OPEN_MIC)}}, []),
                span('.ml-xs', ['open-mic'])
              ]),
            //]),
            //div('.form-check', [
              label('.form-check-inline', [
                input(`.appEventTypeInput.form-check-input`, {attrs: {type: 'checkbox', name: 'eventTypes', value: EventTypes.SHOW, checked: has(event_types, EventTypes.SHOW)}}, []),
                span('.ml-xs', ['show'])
              ])
            //])
            ])
          ]),
          div(`.form-group`, [
            h6('.mb-0', [label({attrs: {for: 'categories'}}, ['Categories'])]),
            div([
            //div('.form-check', [
              label('.form-check-inline', [
                input(`.appCategoriesInput.form-check-input`, {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.COMEDY, checked: has(categories, CategoryTypes.COMEDY)}}, []),
                span('.ml-xs', ['comedy'])
              ]),
            //]),
            //div('.form-check', [
              label('.form-check-inline', [
                input(`.appCategoriesInput.form-check-input`, {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.MUSIC, checked: has(categories, CategoryTypes.MUSIC)}}, []),
                span('.ml-xs', ['music'])
              ]),
            //]),
            //div('.form-check', [
              label('.form-check-inline', [
                input(`.appCategoriesInput.form-check-input`, {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.POETRY, checked: has(categories, CategoryTypes.POETRY)}}, []),
                span('.ml-xs', ['poetry'])
              ]),
            //]),
            //div('.form-check', [
              label('.form-check-inline', [
                input(`.appCategoriesInput.form-check-input`, {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.STORYTELLING, checked: has(categories, CategoryTypes.STORYTELLING)}}, []),
                span('.ml-xs', ['storytelling'])
              ])
            //])
            ])
          ])
        ])
      ])
    })
}

export function main(sources, inputs) {
  const actions = intent(sources)
  const state$ = model(actions, inputs)
  const vtree$ = view(state$, {})
  return {
    DOM: vtree$,
    output$: state$
  }
}
