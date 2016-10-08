import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {ul, li, span, input, div, section, label} from '@cycle/dom'
import Immutable = require('immutable')

import {between, notBetween, combineObj} from '../utils'

function intent(DOM) {
  const UP_KEYCODE = 38
  const DOWN_KEYCODE = 40
  const ENTER_KEYCODE = 13
  const ESC_KEYCODE = 27
  const TAB_KEYCODE = 9

  const input$ = DOM.select('.appAutocompleteable').events('input').publish().refCount()
  const inputClick$ = DOM.select('.appAutocompleteable').events('click')
    .filter(ev => ev.target !== document.activeElement)

  const keydown$ = DOM.select('.appAutocompleteable').events('keydown')
  const itemHover$ = DOM.select('.appAutocompleteItem').events('mouseenter')
    .publish().refCount()
  const itemMouseDown$ = DOM.select('.appAutocompleteItem').events('mousedown')
    .publish().refCount()
  const itemMouseUp$ = DOM.select('.appAutocompleteItem').events('mouseup')
    .publish().refCount()

  const inputFocus$ = DOM.select('.appAutocompleteable').events('focus').publish().refCount()
  const inputBlur$ = DOM.select('.appAutocompleteable').events('blur')
    .filter(ev => ev.target !== document.activeElement) // <--- sketchy? :)
    .publish().refCount()

  const enterPressed$ = keydown$.filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const tabPressed$ = keydown$.filter(({keyCode}) => keyCode === TAB_KEYCODE)
  const escPressed$ = keydown$.filter(({keyCode}) => keyCode === ESC_KEYCODE)
  const clearField$ = input$.filter(ev => ev.target.value.length === 0)

  const inputBlurToItem$ = inputBlur$
    //.do(x => console.log(`blur item`))
    .let(between(itemMouseDown$, itemMouseUp$))
    .publish().refCount()
  const inputBlurToElsewhere$ = inputBlur$
    //.do(x => console.log(`blur elsewhere`))
    .let(notBetween(itemMouseDown$, itemMouseUp$))


  const itemMouseClick$ = itemMouseDown$
    .switchMap(down => {
      return itemMouseUp$.filter(up => down.target === up.target)
      //return DOM.select('.appAutocompleteItem').events('mouseup').filter(up => down.target === up.target)
    })
    .publish().refCount()

  // const itemMouseClick$ = DOM.select('.appAutocompleteItem').events('click')
  //   .publish().refCount()

  return {
    input$: O.merge(input$, inputFocus$).map((ev: any) => ev.target.value),
    search$: input$
      .debounceTime(500)
      .let(between(inputFocus$, inputBlur$))
      .map(ev => ev.target.value)
      .filter(query => query.length > 0),
    moveHighlight$: keydown$
      .map(({keyCode}) => { switch (keyCode) {
        case UP_KEYCODE: return -1
        case DOWN_KEYCODE: return +1
        default: return 0
      }})
      .filter(delta => delta !== 0),
    setHighlight$: itemHover$
      .map(ev => parseInt(ev.target.dataset.index)),
    keepFocusOnInput$:
      O.never(),
      //O.merge(inputBlurToItem$, enterPressed$, tabPressed$),
      //O.merge(enterPressed$, tabPressed$),
    selectHighlighted$:
      O.merge(itemMouseClick$, enterPressed$, tabPressed$).debounceTime(1),
    wantsSuggestions$:
      O.merge(inputFocus$.mapTo(true), inputBlur$.mapTo(false), inputClick$.mapTo(true)),
    quitAutocomplete$:
      O.merge(clearField$, inputBlurToElsewhere$, escPressed$),
    itemMouseDown$,
    itemMouseClick$,
  }
}

function reducers(actions) {
  const moveHighlightR = actions.moveHighlight$
    .map(delta => function moveHighlightReducer(state, itemConfigs) {
      const suggestions = state.get('suggestions')
      const length = suggestions.length
      const wrapAround = x => (x + suggestions.length) % suggestions.length
      const recurseNotSelectable = (index, numItems) => {
        //console.log(`recurseNotSelectable`)
        //console.log(index)
        //console.log(numItems)
        //console.log(itemConfigs)
        const itemType = suggestions[index].type || `default`
        //console.log(itemType)
        if (itemConfigs && itemType && itemConfigs[itemType] && itemConfigs[itemType].selectable) {
          return index
        } else {
          if (numItems >= length) {
            return null
          } else {
            return recurseNotSelectable(wrapAround(index + delta), numItems + 1)
          }
        }
      }

      if (!suggestions || !suggestions.length) {
        return state
      }

      return state.update('highlighted', highlighted => {
        //console.log(`moveHighlightReducer`)
        //console.log(highlighted)
        if (highlighted === null) {
          return recurseNotSelectable(wrapAround(Math.min(delta, 0)), 0)
        } else {
          return recurseNotSelectable(wrapAround(highlighted + delta), 0)
        }
      })
    })
    // .finally(() => {
    //   console.log(`autocomplete moveHighlightR terminating`)
    // })

  const setHighlightR = actions.setHighlight$
    .map(highlighted => function (state, itemConfigs) {
      //console.log(`setHighlightReducer...`)
      const suggestions = state.get('suggestions')
      const itemType = suggestions[highlighted].type
      if (itemConfigs && itemType && itemConfigs[itemType] && itemConfigs[itemType].selectable) {
        return state.set('highlighted', highlighted)
      } else {
        return state
      }
    })
    // .finally(() => {
    //   console.log(`autocomplete setHighlightR terminating`)
    // })

  const selectHighlightedR = actions.selectHighlighted$
    //.switchMap(() => O.of(true, false))
    .map(selected => function selectHighlightedReducer(state) {
      const suggestions = state.get('suggestions')
      const highlighted = state.get('highlighted')
      const hasHighlight = highlighted !== null
      const isMenuEmpty = suggestions.length === 0
      if (selected && hasHighlight && !isMenuEmpty) {
        return state
          .set('selected', suggestions[highlighted])
          .set('suggestions', [])
      } else {
        return state.set('selected', null)
      }
    })
    // .finally(() => {
    //   console.log(`autocomplete selectHighlightedR terminating`)
    // })

  const hideR = actions.quitAutocomplete$
    .mapTo(function hideReducer(state) {
      return state.set('suggestions', [])
    })
    // .finally(() => {
    //   console.log(`autocomplete hideR terminating`)
    // })

  return O.merge(
    moveHighlightR,
    setHighlightR,
    selectHighlightedR,
    hideR
  )
  // .finally(() => {
  //   console.log(`autocomplete reducer$ terminating`)
  // })
}

function model(actions, inputs, itemConfigs) {
  const {props$, suggestions$} = inputs
  const reducer$ = reducers(actions)
  //suggestions$.subscribe()

    // .mapTo([{
    //   name: `Hello`,
    //   address: [`56 Derby Court`, `IL`, `60523`].join(`, `),
    //   venueId: `454`,
    //   latLng: [70.876, -40.076],
    //   source: `Foursquare`,
    //   retrieved: (new Date()).getTime(),
    //   type: `default`
    // }])

  const state$ = O.merge(
    actions.wantsSuggestions$
      .switchMap(accepted => {
        //console.log(`wants suggestions?`, accepted)
        //return suggestions$.map(suggestions => accepted ? suggestions : [])
        return suggestions$.map(suggestions => accepted ? suggestions : [])
      })
      .map(suggestions => ({suggestions, highlighted: null, selected: null})),
    (props$ || O.of(undefined)).map(init => ({suggestions: [], highlighted: null, selected: init || null}))
  )
  .switchMap(state => {
    return reducer$.startWith(Immutable.Map(state)).scan((acc, reducer: Function) => reducer(acc, itemConfigs))
  })
  .map(x => (<any> x).toJS())
  .map(x => {
    return x
  })
  // .finally(() => {
  //   console.log(`autocomplete state$ terminating`)
  // })
  .publishReplay(1).refCount()

  //state$.subscribe()

  return state$
}

function renderAutocompleteMenu({suggestions, highlighted}, itemConfigs) {
  if (suggestions.length === 0) { return null }

  return ul('.autocomplete-menu.autocomplete-results-style',
    suggestions.map((suggestion, index) => {
      const type = suggestion.type
      const config = itemConfigs && itemConfigs[type]

      if (config) {
        const renderer = config.renderer ?
          config.renderer :
          (item, highlighted) => li(
            `.autocomplete-item-style.custom-autocomplete-input-style.${highlighted ? '.light-gray' : ''}`,
            {attrs: {'data-index': index}},
            suggestion.displayValue)

        const el = renderer(suggestion, index, highlighted === index)

        if (config.selectable) {
          el.data.class = {
            appAutocompleteItem: true
          }
        }

        //console.log(`Rendered autocomplete item`)
        // console.log(highlighted)
        // console.log(index)
        //console.log(el)
        return el
      } else {
        console.error(`Could not find autocomplete item configuration for ${JSON.stringify(suggestion)}, skipping...`)
        return null
      }
    })
  )
}

function renderComboBox({suggestions, highlighted, selected}, itemConfigs, displayFunction, placeholder, initialText) {
  return span('.combo-box.combo-box-style', [
    input('.appAutocompleteable.autocomplete-input-style.custom-autocomplete-input-style', {
      props: {type: 'text', placeholder},
      hook: {
        create: (emptyVNode, {elm}) => {
          if (initialText) elm.value = initialText
        },
        update: (old, {elm}) => {
          if (selected !== null) {
            elm.value = displayFunction ? displayFunction(selected) : selected.displayValue
          }
        }
      }
    }),
    renderAutocompleteMenu({suggestions, highlighted}, itemConfigs)
  ])
}

function view(state$, itemConfigs, displayFunction, placeholder, initialText$) {
  return combineObj({state$, initialText$}).map(({state, initialText}: any) => {
    const suggestions = state.suggestions
    const highlighted = state.highlighted
    const selected = state.selected
    return (
      div('.autocomplete-container.container-style', [
        section(`.section-style`, [
          //label(`.search-label.search-label-style`, ['Query:']),
          renderComboBox({suggestions, highlighted, selected}, itemConfigs, displayFunction, placeholder, initialText)
        ])
      ])
    )
  })
}

function preventedEvents(actions, state$) {
  return state$
    .switchMap(state => {
      //console.log(`Subscribing to keepFocusOnInput$`)
      return actions.keepFocusOnInput$
        // .startWith(`start`)
        // .do(x => {
        //   if (x === `start`) {
        //     console.log(`subscribing to keepFocusOnInput$`)
        //   }
        //   return x
        // })
        // .filter(x => x !== `start`)
        .map(event => {
          if (state.suggestions.length > 0
          && state.highlighted !== null) {
            return event
          } else {
            return null
          }
        })
    })
    .filter(ev => ev !== null)
}

function main(sources, {suggester, itemConfigs, displayFunction, placeholder, initialText$}) {
  const actions = intent(sources.DOM)

  const suggestionComponent = suggester(sources, {input$: actions.input$})
  const state$ = model(actions, {suggestions$: suggestionComponent.results$}, itemConfigs)
  
  const vtree$ = view(state$, itemConfigs, displayFunction, placeholder, initialText$ || O.of(``))
  const prevented$ = preventedEvents(actions, state$)
  const toHTTP$ = suggestionComponent.HTTP
  //state$.subscribe()
  return {
    DOM: vtree$,
    HTTP: toHTTP$,
    Global: O.merge(
      prevented$.map(ev => ({type: `preventDefault`, data: ev})),
      actions.itemMouseDown$.map(ev => ({type: `preventDefault`, data: ev})),
      // actions.itemMouseClick$.map(ev => ({type: `blur`, data: document.activeElement}))
      //   .delay(4)
    ),
    input$: //O.never(),
      actions.input$
        // .do(x => {
        //   console.log(`Autocomplete input...`)
        //   console.log(x)
        // })
        .filter(x => !!x),
    selected$:
      state$.map(state => state.selected)
        .filter(x => !!x)
        // .do(x => {
        //   console.log(`Autocomplete selected...`)
        //   console.log(x)
        // })
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)
