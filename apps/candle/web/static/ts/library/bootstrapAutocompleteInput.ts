import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {ul, li, span, input, div, section, label} from '@cycle/dom'
import Immutable = require('immutable')

import {between, notBetween, combineObj, traceStartStop} from '../utils'

function intent(DOM) {
  const UP_KEYCODE = 38
  const DOWN_KEYCODE = 40
  const ENTER_KEYCODE = 13
  const ESC_KEYCODE = 27
  const TAB_KEYCODE = 9

  const input$ = DOM.select('.appAutocompleteable').events('input')
    //.do(x => console.log(`input`, x))
    .publish().refCount()
    
  const inputClick$ = DOM.select('.appAutocompleteable').events('click')
    .filter(ev => ev.target !== document.activeElement)

  const keydown$ = DOM.select('.appAutocompleteable').events('keydown')
  const itemHover$ = DOM.select('.appAutocompleteItem').events('mouseenter')
    .publish().refCount()
  const itemMouseDown$ = DOM.select('.appAutocompleteItem').events('mousedown')
    .publish().refCount()
  const itemMouseUp$ = DOM.select('.appAutocompleteItem').events('mouseup')
    .publish().refCount()

  const inputFocus$ = DOM.select('.appAutocompleteable').events('focus')
    //.do(x => console.log(`input focus`))
    .publish().refCount()
  const inputBlur$ = DOM.select('.appAutocompleteable').events('blur')
    .filter(ev => ev.target !== document.activeElement) // <--- sketchy? :)
    .publish().refCount()

  const enterPressed$ = keydown$.filter(({keyCode}) => keyCode === ENTER_KEYCODE)
  const tabPressed$ = keydown$.filter(({keyCode}) => keyCode === TAB_KEYCODE)
  const escPressed$ = keydown$.filter(({keyCode}) => keyCode === ESC_KEYCODE)
  const clearField$ = input$.filter(ev => ev.target.value.length === 0)
    .publish().refCount()
  const notClearField$ = input$.filter(ev => ev.target.value.length > 0)
    //.do(x => console.log(`not clear field`))
    .publish().refCount()

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
    input$: O.merge(input$, inputFocus$).map((ev: any) => ev.target.value)
        //.do(x => console.log(`input 2`, x))
        .publish().refCount(),
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
    wantsSuggestions$: O.merge(
        clearField$.mapTo(false), 
        notClearField$.mapTo(true), 
        inputFocus$.mapTo(true), 
        inputBlur$.mapTo(false), 
        inputClick$.mapTo(true)
    ),
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


  const selectHighlightedR = actions.selectHighlighted$
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

  const hideR = actions.quitAutocomplete$
    //.do(x => console.log(`quitAutocomplete...`))
    .mapTo(function hideReducer(state) {
      return state.set('suggestions', [])
    })

  return O.merge(
    moveHighlightR,
    setHighlightR,
    selectHighlightedR,
    hideR
  )
}

const findFirstSelectable = (index, suggestions, itemConfigs) => {
  if (suggestions && suggestions.length) {
      const itemType = suggestions[index].type
      if (itemConfigs && itemType && itemConfigs[itemType] && itemConfigs[itemType].selectable) {
        return index
      } else {
        if (index < suggestions.length)
          return findFirstSelectable(index + 1, suggestions, itemConfigs)
        else 
          return null
      }
  } else {
    return null
  }
}

function model(actions, inputs, itemConfigs) {
  const {props$, suggestions$} = inputs
  const reducer$ = reducers(actions)
  const state$ = O.merge(
    actions.wantsSuggestions$
      .distinctUntilChanged()
      .switchMap(accepted => {
        //console.log(`accepted`, accepted)
        return suggestions$
          //.do(x => console.log(`suggestions...`, x))
          .map(suggestions => accepted ? suggestions : [])
          //.letBind(traceStartStop(`suggestions trace`))
      })
      .map(suggestions => ({suggestions, highlighted: findFirstSelectable(0, suggestions, itemConfigs), selected: null})),
    (props$ || O.of(undefined)).map(init => ({suggestions: [], highlighted: null, selected: init || null}))
  )
  .switchMap(state => {
    return reducer$.startWith(Immutable.Map(state)).scan((acc, reducer: Function) => reducer(acc, itemConfigs))
  })
  .map(x => (<any> x).toJS())
  //.do(x => console.log(`autocomplete state`, x))
  //.letBind(traceStartStop(`autocomplete state trace`))
  .publishReplay(1).refCount()

  return state$
}

function renderAutocompleteMenu({suggestions, highlighted}, itemConfigs) {
  if (suggestions.length === 0) { return null }

  return ul(`.dropdown-menu`, { style: {
        // position: "absolute", 
        // //top: "2.25rem", 
        // "background-color": "white", 
        // "z-index": 1000,
        width: "100%",
        // border: "1px solid light-gray",
        // display: "block"
      }}, suggestions.map((suggestion, index) => {
        const type = suggestion.type
        const config = itemConfigs && itemConfigs[type]

        if (config) {
          const renderer = config.renderer

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

function renderComboBox({suggestions, highlighted, selected}, initialText, props) {
  const {itemConfigs, displayFunction, placeholder, name, styleClass} = props
  return div(`.dropdown.open`, [
    // div('.col-xs-12.form-group.dropdown.open', [
      input(`.appAutocompleteable.form-control`, {
        attrs: {type: `text`, placeholder, name, autofocus: true},
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
    // ])
  ])
}

function view(state$, initialText$, props) {
  return combineObj({state$, initialText$}).map(({state, initialText}: any) => {
    const suggestions = state.suggestions
    const highlighted = state.highlighted
    const selected = state.selected
    return renderComboBox({suggestions, highlighted, selected}, initialText, props)
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

function main(sources, results$, initialText$, props) {
  const actions = intent(sources.DOM)

  const state$ = model(actions, {
    suggestions$: results$
      //.do(x => console.log(`got internal results`, x))
      //.letBind(traceStartStop(`trace results`))
  }, props.itemConfigs)
  
  const vtree$ = view(state$, initialText$ || O.of(``), props )
  const prevented$ = preventedEvents(actions, state$)
  return {
    DOM: vtree$,
    Global: O.merge(
      prevented$.map(ev => ({type: `preventDefault`, data: ev})),
      actions.itemMouseDown$.map(ev => ({type: `preventDefault`, data: ev})),
      // actions.itemMouseClick$.map(ev => ({type: `blur`, data: document.activeElement}))
      //   .delay(4)
    ),
    input$: //O.never(),
      actions.input$,
    selected$:
      state$.map((state: any) => state.selected)
        .filter(x => !!x)
  }
}

export default (sources, results$, initialText$, props) => isolate(main)(sources, results$, initialText$, props)
