import {Observable as O} from 'rxjs'
import {div, span, input, textarea} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'
import {inflateDates, fromCheckbox} from '../helpers'

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .map(x => x.state.data)
    .map(session => {
      //console.log(`meta session pre`, session)
      session.listing.type = session.listing.type || undefined
      session.listing.event_types = session.listing.event_types || []
      session.listing.categories = session.listing.categories || []
      session.listing.meta = session.listing.meta || {
        type: 'standard',
        title: undefined,
        description: undefined,
        short_description: undefined
      }

      return session
    })
    .map(inflateDates)
    .publishReplay(1).refCount()
  
  const type$ = DOM.select('.appTypeInput').events('click')
    .map(ev => ev.target.value)
  const title$ = DOM.select('.appTitleInput').events('input')
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
    title$,
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
  return listing.meta.type && listing.meta.title && listing.meta.description &&
    listing.event_types.length && listing.categories.length
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

  const title_r = actions.title$.map(val => state => {
    return state.update('session', session => {
      const {listing} = session
      listing.meta.title = val
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

  const event_types_r = actions.event_type$.map(val => state => {
    return state.update('session', session => {
      const {listing} = session
      listing.event_types = processCheckboxArray(val, listing.event_types)
      return session
    })
  })

  const category_r = actions.category$.map(val => state => {
    return state.update('session', session => {
      //console.log(`category`, val)
      const {listing} = session
      listing.categories = processCheckboxArray(val, listing.categories)
      return session
    })
  })

  return O.merge(type_r, title_r, description_r, event_types_r, category_r)
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

function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {session} = state
      const {listing} = session
      const {type, meta, event_types, categories} = listing
      const {title, description} = meta

      return div(`.workflow-step`, [
        div(`.heading`, []),
        div(`.body`, [
          div(`.column.margin-bottom`, [
            div(`.sub-heading`, ['Listing type']),
            div(`.row`, [
              div(`.radio-input`, [
                input(`.appTypeInput`, {attrs: {type: 'radio', name: 'listingType', value: 'single', checked: type === `single`}}, []),
                span(`.title`, ['Single'])
              ]),
              div(`.radio-input`, [
                input(`.appTypeInput`, {attrs: {type: 'radio', name: 'listingType', value: 'recurring', checked: type === `recurring`}}, []),
                span(`.title`, ['Recurring'])
              ])
            ])
          ]),
          div(`.column.margin-bottom`, [
            div(`.sub-heading`, ['Title']),
            div(`.input`, [
              input(`.appTitleInput.full-width`, {attrs: {type: 'text', value: title || ''}}, [])
            ])
          ]),
          div(`.column.margin-bottom`, [
            div(`.sub-heading`, [`Description`]),
            textarea(`.appDescriptionInput`, [
              description || ''
            ])
          ]),
          div(`.column.margin-bottom`, [
            div(`.sub-heading`, ['Event types']),
            div(`.row`, [
              div(`.checkbox-input`, [
                input(`.appEventTypeInput`, {attrs: {type: 'checkbox', name: 'event_types', value: 'open-mic', checked: event_types.some(x => x === 'open-mic')}}, []),
                span(`.title`, ['open-mic'])
              ]),
              div(`.checkbox-input`, [
                input(`.appEventTypeInput`, {attrs: {type: 'checkbox', name: 'event_types', value: 'show', checked: event_types.some(x => x === 'show')}}, []),
                span(`.title`, ['show'])
              ])
            ])
          ]),
          div(`.column.margin-bottom`, [
            div(`.sub-heading`, ['Categories']),
            div(`.row`, [
              div(`.checkbox-input`, [
                input(`.appCategoriesInput`, {attrs: {type: 'checkbox', name: 'categories', value: 'comedy', checked: categories.some(x => x === 'comedy')}}, []),
                span(`.title`, ['comedy'])
              ]),
              div(`.checkbox-input`, [
                input(`.appCategoriesInput`, {attrs: {type: 'checkbox', name: 'categories', value: 'music', checked: event_types.some(x => x === 'music')}}, []),
                span(`.title`, ['music'])
              ]),
              div(`.checkbox-input`, [
                input(`.appCategoriesInput`, {attrs: {type: 'checkbox', name: 'categories', value: 'poetry', checked: categories.some(x => x === 'poetry')}}, []),
                span(`.title`, ['poetry'])
              ]),
              div(`.checkbox-input`, [
                input(`.appCategoriesInput`, {attrs: {type: 'checkbox', name: 'categories', value: 'storytelling', checked: event_types.some(x => x === 'storytelling')}}, []),
                span(`.title`, ['storytelling'])
              ])
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
