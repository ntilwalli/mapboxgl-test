import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify, has, arrayUnique} from '../../../../../utils'
import {CategoryTypes, ComedyTypes, MusicTypes, DanceTypes} from '../../../../../listingTypes'

import {fromCheckbox, processCheckboxArray} from '../../../../helpers/listing/utils'

import ShowAndOpenStage from './showAndOpenStage'
import Comedy from './comedy'
import Music from './music'

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
  const init_categories$ = inputs.session$
    .map(session => {
      return session.listing.meta.categories
    }).publishReplay(1).refCount()

  const comedy_component = isolate(Comedy)(sources, {...inputs, props$: init_categories$})
  const music_component = isolate(Music)(sources, {...inputs, props$: init_categories$})

  const components = {
    comedy: comedy_component.DOM,
    music: music_component.DOM
  }


  const vtree$ = combineObj(components)
    .map((components: any) => {
      return div('.d-flex.flex-column', [
        components.comedy,
        components.music
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
      music_component.output$
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

  const merged = mergeSinks(comedy_component)

  return {
    ...merged,
    DOM: vtree$,
    output$
  }
}