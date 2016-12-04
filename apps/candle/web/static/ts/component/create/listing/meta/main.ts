import {Observable as O} from 'rxjs'
import {div, span, input, textarea} from '@cycle/dom'
import Immutable = require('immutable')
import {combineObj} from '../../../../utils'
import {inflateDates} from '../helpers'

function intent(sources) {
  const {DOM, Router} = sources
  const session$ = Router.history$
    .map(x => x.state.data)
    .map(inflateDates)
    .publishReplay(1).refCount()
  
  const type$ = DOM.select('.appTypeInput').events('click')
    .map(ev => ev.target.value)
  const title$ = DOM.select('.appTitleInput').events('input')
    .map(ev => ev.target.value)
  const description$ = DOM.select('.appDescriptionInput').events('input')
    .map(ev => ev.target.value)

  return {
    session$,
    type$,
    title$,
    description$
  }
}

function isValid(session) {
  console.log(`meta valid`, session)
  const {listing} = session
  return listing.type && listing.title && listing.description
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
    return state.update(`session`, session => {
      const {listing} = session
      listing.title = val
      return session
    })
  })

  const description_r = actions.description$.map(val => state => {
    return state.update(`session`, session => {
      const {listing} = session
      listing.description = val
      return session
    })
  })

  return O.merge(type_r, title_r, description_r)
}

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)
  return combineObj({
      session$: actions.session$.take(1)
    })
    .switchMap((info: any) => {
      console.log(`meta init`, info)
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
      const {type, title, description} = listing

      return div(`.workflow-step`, [
        div(`.heading`, []),
        div(`.body`, [
          div(`.input-section`, [
            div(`.sub-heading`, ['Type']),
            div(`.input-area`, [
              div(`.radio-input`, [
                input(`.appTypeInput.title`, {attrs: {type: 'radio', name: 'listingType', value: 'single', checked: type === `single`}}, []),
                span(`.title`, ['Single'])
              ]),
              div(`.radio-input`, [
                input(`.appTypeInput.title`, {attrs: {type: 'radio', name: 'listingType', value: 'recurring', checked: type === `recurring`}}, []),
                span(`.title`, ['Recurring'])
              ])
            ])
          ]),
          div(`.input-section`, [
            div(`.sub-heading`, ['Title']),
            div(`.input`, [
              input(`.appTitleInput.title`, {attrs: {type: 'text', value: title || ''}}, [])
            ])
          ]),
          div(`.input-section`, [
            div(`.sub-heading`, [`Description`]),
            div(`.input-area`, [
              textarea(`.appDescriptionInput`, [
                description || ''
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
