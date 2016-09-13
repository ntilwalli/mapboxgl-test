import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {ul, li, span, input, div, section, label} from '@cycle/dom'
import Immutable from 'immutable'

import {between, notBetween, combineObj} from '../utils'

function intent(DOM) {
  const UP_KEYCODE = 38
  const DOWN_KEYCODE = 40
  const ENTER_KEYCODE = 13
  const ESC_KEYCODE = 27
  const TAB_KEYCODE = 9

  const input$ = DOM.select('.appAutocompleteable').events('input')
    .share()
  const keydown$ = DOM.select('.appAutocompleteable').events('keydown')
  const itemHover$ = DOM.select('.appAutocompleteItem').events('mouseenter')
    .do(x => console.log(`itemHover`, x))
    .share()
  const itemMouseDown$ = DOM.select('.appAutocompleteItem').events('mousedown')
    .do(x => console.log(`itemMouseDown`, x))
    .share()
  const itemMouseUp$ = DOM.select('.appAutocompleteItem').events('mouseup')
    .do(x => console.log(`itemMouseDown`, x))
    .share()

  const inputFocus$ = DOM.select('.appAutocompleteable').events('focus').share()
  const inputBlur$ = DOM.select('.appAutocompleteable').events('blur')
    .filter(ev => ev.target !== document.activeElement) // <--- sketchy? :)
    .do(x => console.log(`inputBlur`, x))
    .share()

  const enterPressed$ = keydown$.filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const tabPressed$ = keydown$.filter(({keyCode}) => keyCode === TAB_KEYCODE)
  const escPressed$ = keydown$.filter(({keyCode}) => keyCode === ESC_KEYCODE)
  const clearField$ = input$.filter(ev => ev.target.value.length === 0)

  const inputBlurToItem$ = inputBlur$.let(between(itemMouseDown$, itemMouseUp$))
    .do(x => console.log(`inputBlurToItem`, x))
    .share()
  const inputBlurToElsewhere$ = inputBlur$.let(notBetween(itemMouseDown$, itemMouseUp$))


  const itemMouseClick$ = itemMouseDown$
    .switchMap(down => itemMouseUp$.filter(up => down.target === up.target))
    .do(x => console.log(`itemMouseClick`, x))
    .share()

  //inputBlurToItem$.subscribe() 

  return {
    input$: O.merge(input$, inputFocus$).map(ev => ev.target.value),
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
      O.merge(inputBlurToItem$, enterPressed$, tabPressed$),
    selectHighlighted$:
      O.merge(itemMouseClick$, enterPressed$, tabPressed$).debounceTime(1),
    wantsSuggestions$:
      O.merge(inputFocus$.mapTo(true), inputBlur$.mapTo(false)),
    quitAutocomplete$:
      O.merge(clearField$, inputBlurToElsewhere$, escPressed$),
    inputBlur$: O.never()
  }
}

function reducers(actions, inputs) {
  const moveHighlightReducer$ = actions.moveHighlight$
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

  const setHighlightReducer$ = actions.setHighlight$
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

  const selectHighlightedReducer$ = actions.selectHighlighted$
    .switchMap(() => O.of(true, false))
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

  const hideReducer$ = actions.quitAutocomplete$
    .mapTo(function hideReducer(state) {
      return state.set('suggestions', [])
    })

  return O.merge(
    moveHighlightReducer$,
    setHighlightReducer$,
    selectHighlightedReducer$,
    hideReducer$
  )
}

function model(actions, {props$, suggestions$}, itemConfigs) {
  const reducer$ = reducers(actions)

  const state$ = O.merge(
    actions.wantsSuggestions$
      .switchMap(accepted => {
        return suggestions$.map(suggestions => accepted ? suggestions : [])
      })
      .map(suggestions => ({suggestions, highlighted: null, selected: null})),
    (props$ || O.of(undefined)).map(init => ({suggestions: [], highlighted: null, selected: init || null}))
  )
  .switchMap(state => {
    return reducer$.startWith(Immutable.Map(state)).scan((acc, reducer) => reducer(acc, itemConfigs))
  })
  .map(x => x.toJS())
  .map(x => {
    return x
  })
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

        el.data.class = {
          appAutocompleteItem: true
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
            elm.value = displayFunction ? displayFunction(selected) : x.displayValue
          }
        }
      }
    }),
    renderAutocompleteMenu({suggestions, highlighted}, itemConfigs)
  ])
}

function view(state$, itemConfigs, displayFunction, placeholder, initialText$) {
  return combineObj({state$, initialText$}).map(({state, initialText}) => {
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
      console.log(`Subscribing to keepFocusOnInput$`)
      return actions.keepFocusOnInput$.map(event => {
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
      actions.inputBlur$.map(ev => ({type: `preventWindowBlur`, data: ev}))
    ),
    input$: actions.input$.do(x => {
        console.log(`Autocomplete input...`)
        console.log(x)
      })
      .filter(x => !!x),
    selected$: state$.map(state => state.selected)
      .filter(x => !!x)
      .do(x => {
        console.log(`Autocomplete selected...`)
        console.log(x)
      })
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)
