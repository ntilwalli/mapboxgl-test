import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify, has, arrayUnique} from '../../../../../utils'
import {CategoryTypes, ComedyTypes, MusicTypes, DanceTypes} from '../../../../../listingTypes'
import {findComedy, findMusic, findDance, findStorytelling, findSpokenWord, findVariety} from '../../../../helpers/listing/utils'
import {fromCheckbox, processCheckboxArray} from '../../../../helpers/listing/utils'
import CheckboxParent from './checkboxParent'

function applyChange(session, val) {
  session.listing.meta.categories = val
}

function BlankComponent() {
  return {
    DOM: O.of(undefined),
    output$: O.of([])
  }
}

export default function main(sources, inputs) {
  const init_categories$ = inputs.categories$

  const comedy_props$ = O.of({
    parent_category: 'comedy',
    base: ComedyTypes,
    finder: findComedy
  })

  const comedy_component = isolate(CheckboxParent)(sources, {
    ...inputs, 
    initial_state$: init_categories$, 
    props$: comedy_props$
  })

  const music_props$ = O.of({
    parent_category: 'music',
    base: MusicTypes,
    finder: findMusic
  })

  const music_component = isolate(CheckboxParent)(sources, {
    ...inputs, 
    initial_state$: init_categories$, 
    props$: music_props$
  })

  const spoken_word_props$ = O.of({
    parent_category: 'spoken_word',
    base: undefined,
    finder: findSpokenWord
  })

  const spoken_word_component = isolate(CheckboxParent)(sources, {
    ...inputs, 
    initial_state$: init_categories$, 
    props$: spoken_word_props$
  })

  const storytelling_props$ = O.of({
    parent_category: 'storytelling',
    base: undefined,
    finder: findStorytelling
  })

  const storytelling_component = isolate(CheckboxParent)(sources, {
    ...inputs, 
    initial_state$: init_categories$, 
    props$: storytelling_props$
  })

  // const dance_props$ = O.of({
  //   parent_category: 'dance',
  //   base: DanceTypes,
  //   finder: findDance
  // })

  // const dance_component = isolate(CheckboxParent)(sources, {
  //   ...inputs, 
  //   initial_state$: init_categories$, 
  //   props$: dance_props$
  // })

  const variety_props$ = O.of({
    parent_category: 'variety',
    base: undefined,
    finder: findVariety
  })

  const variety_component = isolate(CheckboxParent)(sources, {
    ...inputs, 
    initial_state$: init_categories$, 
    props$: variety_props$
  })


  const components = {
    comedy: comedy_component.DOM,
    music: music_component.DOM,
    spoken_word: spoken_word_component.DOM,
    storytelling: storytelling_component.DOM,
    //dance: dance_component.DOM,
    variety: variety_component.DOM
  }


  const vtree$ = combineObj(components)
    .map((components: any) => {
      return div('.d-flex.flex-column', [
        components.comedy,
        components.music,
        components.spoken_word,
        components.storytelling,
        //components.dance,
        components.variety
        // components.music ? div('.ml-4', [
        //   h6(['Music sub-categories']),
        //   components.music
        // ]) : null,
        // components.dance ? div('.ml-4', [
        //   h6(['Dance sub-categories']),
        //   components.dance
        // ]) : null
      ])
    })

  const output$ = O.combineLatest(
      comedy_component.output$,
      music_component.output$,
      spoken_word_component.output$,
      storytelling_component.output$,
      //dance_component.output$,
      variety_component.output$
    )
    .map(arrs => arrs.reduce((acc: any[], arr) => acc.concat(arr), []))
    .map(categories => {
      return {
        data: categories,
        apply: applyChange,
        valid: true,
        errors: []
      }
    })
    .publishReplay(1).refCount()

  const merged = mergeSinks(
    comedy_component, 
    music_component, 
    spoken_word_component, 
    storytelling_component,
    //dance_component,
    variety_component
  )

  return {
    ...merged,
    DOM: vtree$,
    output$
  }
}