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

  const init_comedy$ = init_categories$
    .map(categories => {
      return categories.filter(x => x.indexOf('/comedy') === 0)
    }).publishReplay(1).refCount()

  const init_music$ = init_categories$
    .map(categories => {
      return categories.filter(x => x.indexOf('/music') === 0)
    }).publishReplay(1).refCount()

  // const init_dance$ = init_categories$
  //   .map(categories => {
  //     return categories.filter(x => x.indexOf('/dance') === 0)
  //   }).publishReplay(1).refCount()

  const init_root$ = init_categories$
    .map(categories => {
      return categories.map(cat => cat.split('/')[0]).filter(arrayUnique)
    })

  const root = ShowAndOpenStage(sources, {...inputs, props$: init_root$})

  const root_comedy$ = root.output$
    .map(x => has(x, CategoryTypes.COMEDY))
    .map(x => !!x ? [] : undefined)

  const root_music$ = root.output$
    .map(x => has(x, CategoryTypes.MUSIC))
    .map(x => !!x ? [] : undefined) 

  // const root_dance$ = root.output$
  //   .map(x => has(x, CategoryTypes.DANCE))
  //   .map(x => !!x ? [] : undefined) 

  const comedy_component$ = O.merge(init_comedy$, root_comedy$)
    .map(categories => {
      if (categories) {
        const out = Comedy(sources, {...inputs, props$: O.of(categories)})
        return {
          ...out, 
          output$: out.output$.map((arr: any[]) => {
            if (arr.length === 0) {
              return Object.keys(ComedyTypes).map(x => '/comedy/' + ComedyTypes[x])
            } else {
              return arr
            }
          })
        }
      } else {
        return BlankComponent()
      }
    }).publishReplay(1).refCount()
  
  const comedy_component = componentify(comedy_component$)

  const music_component$ = O.merge(init_comedy$, root_music$)
    .map(categories => {
      if (categories) {
        const out =  Music(sources, {...inputs, props$: O.of(categories)})
        return {
          ...out, 
          output$: out.output$.map((arr: any[]) => {
            if (arr.length === 0) {
              return Object.keys(MusicTypes).map(x => '/music/' + MusicTypes[x])
            } else {
              return arr
            }
          })
        }
      } else {
        return BlankComponent()
      }
    }).publishReplay(1).refCount()
  
  const music_component = componentify(music_component$)

  const components = {
    root: root.DOM,
    comedy: comedy_component.DOM,
    music: music_component.DOM
  }


  const vtree$ = combineObj(components)
    .map((components: any) => {
      return div('.d-flex.flex-column', [
        div([components.root]),
        components.comedy ? div('.ml-4', [
          h6(['Comedy sub-categories']),
          components.comedy
        ]) : null,
        components.music ? div('.ml-4', [
          h6(['Music sub-categories']),
          components.music
        ]) : null,
        components.dance ? div('.ml-4', [
          h6(['Dance sub-categories']),
          components.dance
        ]) : null
      ])
    })

  const output$ = O.combineLatest(
      root.output$.filter(x => x.filter(x => x === 'trivia').map(x => '/' + x)),
      comedy_component$.switchMap((c: any) => c.output$),
      music_component$.switchMap((c: any) => c.output$)
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

  const merged = mergeSinks(root, comedy_component)

  return {
    ...merged,
    DOM: vtree$,
    output$
  }
}