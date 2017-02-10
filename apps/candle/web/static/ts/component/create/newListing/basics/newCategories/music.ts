import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../../utils'
import {CategoryTypes, MusicTypes} from '../../../../../listingTypes'

import {fromCheckbox, processCheckboxArray, has} from '../../../../helpers/listing/utils'

function intent(sources) {
  const {DOM} = sources
  
  const type$ = DOM.select('.appMusicTypeInput').events('click')
    .map(fromCheckbox)

  const category$ = DOM.select('.appMusicInput').events('click') 

  return {
    type$,
    category$
  }
}

function reducers(actions, inputs) {
  const type_r = actions.type$.map(msg => state => {
    return state.update('categories', (categories: any) => {
      const new_categories = categories.toJS()
      return Immutable.fromJS(processCheckboxArray(msg, new_categories))
    })
  })

  const category_r = actions.category$.map(msg => state => {
    const new_state = state.update('active', val => !val)
    const active = new_state.get('active')
    // if (active) {
    //   const new_categories = Object.keys(ComedyTypes).map(x => ComedyTypes[x])
    //   return new_state.set('categories', Immutable.fromJS(new_categories))
    // } else {
      return new_state.set('categories', Immutable.fromJS([]))
    //}
  })

  return O.merge(type_r, category_r)
}

const findMusic = x => x.indexOf('/music') === 0

function model(actions, inputs) {
  const reducer$ = reducers(actions, inputs)

  return inputs.props$
    .switchMap(props => {
      const active = props.some(findMusic)
      const categories = props.filter(findMusic)
        .map(cat => {
          const out = cat.split('/').filter(Boolean)
          if (out.length === 2) {
            return out[1]
          } else {
            return undefined
          }
        }).filter(Boolean)

      console.log('props categories', categories)

      return reducer$
        .startWith(Immutable.fromJS({categories, active}))
        .scan((acc, f: Function) => f(acc))
    })
    .map((x: any) => x.toJS())
    .publishReplay(1).refCount()
}

function view(state$) {
  return state$.map(state => {
    const {active, categories} = state
    const hip_hop = has(categories, MusicTypes.HIP_HOP)
    const singer_songwriter = has(categories, MusicTypes.SINGER_SONGWRITER)
    const country = has(categories, MusicTypes.COUNTRY)
    const rock = has(categories, MusicTypes.ROCK)
    const electronic = has(categories, MusicTypes.ELECTRONIC)
    const jazz = has(categories, MusicTypes.JAZZ)

    return div([
      div('.form-check.form-check-inline', [
        label('.form-check-label', [
          input('.appMusicInput.form-check-input', {attrs: {type: 'checkbox', name: 'categories', value: CategoryTypes.MUSIC, checked: active}}, []),
          span('.ml-xs', ['music'])
        ]),
      ]),
      active ? div('.ml-4', {class: {'read-only': !active}}, [
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appMusicTypeInput.form-check-input`, {props: {checked: singer_songwriter}, attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.SINGER_SONGWRITER, checked: singer_songwriter}}, []),
            span('.ml-xs', ['singer-songwriter'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appMusicTypeInput.form-check-input`, {props: {checked: hip_hop}, attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.HIP_HOP, checked: hip_hop}}, []),
            span('.ml-xs', ['hip-hop'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appMusicTypeInput.form-check-input`, {props: {checked: rock}, attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.ROCK, checked: rock}}, []),
            span('.ml-xs', ['rock'])
          ])
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appMusicTypeInput.form-check-input`, {props: {checked: country}, attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.COUNTRY, checked: country}}, []),
            span('.ml-xs', ['country'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appMusicTypeInput.form-check-input`, {props: {checked: electronic}, attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.ELECTRONIC, checked: electronic}}, []),
            span('.ml-xs', ['electronic'])
          ]),
        ]),
        div('.form-check.form-check-inline', [
          label('.form-check-label', [
            input(`.appMusicTypeInput.form-check-input`, {props: {checked: jazz}, attrs: {type: 'checkbox', name: 'music_categories', value: MusicTypes.JAZZ, checked: jazz}}, []),
            span('.ml-xs', ['jazz'])
          ])
        ])
      ]) : null
    ])
  })
}

export default function main(sources, inputs) {

  const actions = intent(sources)
  const state$ = model(actions, inputs)

  const vtree$ = view(state$)


  return {
    DOM: vtree$,
    output$: state$
      .map((state: any) => {
        if (state.categories.length === 0) {
          return Object.keys(MusicTypes).map(x => '/music/' + MusicTypes[x])
        } else {
          return state.categories.map(x => '/music' + x)
        }
      })
      .publishReplay(1).refCount()
  }
}