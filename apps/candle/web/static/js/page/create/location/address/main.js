import {Observable as O} from 'rxjs'

import {div, input, select, option, h5, li, span} from '@cycle/dom'
import Immutable from 'immutable'
import {combineObj, createProxy, spread} from '../../../../utils'

import {countryToAlpha2} from '../../../../util/countryCodes'
import {getState} from '../../../../util/states'

import AutocompleteInput from '../../../../library/autocompleteInput'
import ArcGISSuggest from '../../../../thirdParty/ArcGISSuggest'
import ArcGISGetMagicKey from '../../../../thirdParty/ArcGISGetMagicKey'

const addressItemConfigs = {
  default: {
    selectable: true,
    renderer: (suggestion, index, highlighted) => {
      return li(
        `.address-autocomplete-item.autocomplete-item-style.custom-autocomplete-input-style.${highlighted ? '.light-gray' : ''}`,
        {attrs: {'data-index': index}},
        [
          span(`.address-info`, [suggestion.name])
        ]
      )
    }
  }
}

const extractStreetAddress = x => {
      const val = x.match(/^(.*?),.*$/)
      if (val) {
        return val[1]
      } else {
        return `error`
      }
    }

function intent(sources) {
  const {DOM} = sources
  const countryCode$ = DOM.select(`.appCountryInput`).events(`change`)
    .map(ev => ev.target.value)

  const aptSuiteBldg$ = DOM.select(`.appAptSuiteBldgInput`).events(`input`)
    .map(ev => ev.target.value)

  const city$ = DOM.select(`.appCityInput`).events(`input`)
    .map(ev => ev.target.value)

  const stateAbbr$ = DOM.select(`.appStateAbbrInput`).events(`input`)
    .map(ev => ev.target.value)

  const zipCode$ = DOM.select(`.appZipCodeInput`).events(`input`)
    .map(ev => ev.target.value)

  return {
    countryCode$,
    aptSuiteBldg$,
    city$,
    stateAbbr$,
    zipCode$,

  }
}

function reducers(actions, inputs) {

  const countryCodeR = actions.countryCode$.map(cc => state => {
    return state.set(`countryCode`, cc)
  })

  const streetAddressR = inputs.streetAddress$.map(val => state => {
    //const street = extractStreetAddress(val)
    return state.set(`street`, val)
  })

  const aptSuiteBldgR = actions.aptSuiteBldg$.map(val => state => {
    return state.set(`aptSuiteBldg`, val)
  })

  const cityR = actions.city$.map(val => state => {
    return state.set(`city`, val)
  })

  const stateAbbrR = actions.stateAbbr$.map(val => state => {
    return state.set(`stateAbbr`, val)
  })

  const zipCodeR = actions.zipCode$.map(val => state => {
    return state.set(`zipCode`, val)
  })

  const autocompleteR = inputs.autocomplete$.map(sa => state => {
    // console.log(`street address reducer`)
    // console.log(sa.data)
    const region = sa.region
    const pa = region.data.parsedAddress
    const street = extractStreetAddress(region.data.raw)
    const stateAbbr = getState(pa.state)
    return state
      .set(`city`, pa.city)
      .set(`zipCode`, pa.zip)
      .set(`stateAbbr`, stateAbbr)
      .set(`street`, street !== `error` ? street : undefined)
      .set(`latLng`, {
        type: `auto`,
        data: sa.center
      })
  })

  return O.merge(
    countryCodeR,
    streetAddressR,
    aptSuiteBldgR,
    cityR,
    stateAbbrR,
    zipCodeR,
    autocompleteR
  )
}



function model(actions, inputs) {
  const {props$, listing$, searchArea$} = inputs
  return combineObj({
      props$: props$.take(1),
      listing$: listing$.take(1),
      searchArea$: searchArea$.take(1)
    })
    .switchMap(({props, listing, searchArea}) => {
      const info = listing.profile.location.info
      const cc = searchArea.region.type === `somewhere` ? searchArea.region.data.country : undefined
      const initialState = {
        countryCode: cc,
        street: info && info.street || undefined,
        aptSuiteBldg: info && info.aptSuiteBldg || undefined,
        city: info && info.city || undefined,
        stateAbbr: info && info.stateAbbr || undefined,
        zipCode: info && info.zipCode || undefined,
        latLng: info && info.latLng || undefined,
      }

      return reducers(actions, inputs)
        .startWith(Immutable.Map(initialState))
        .scan((state, f) => f(state))
    })
    .map(x => x.toJS())
    .do(x => console.log(`address state`, x))
    .publishReplay(1).refCount()
}

const countries = [
  `Canada`,
  `United States`
]

const convertCountryToOption = (c, state) => {
  const alpha2 = countryToAlpha2(c)
  return option(`.option`, {props: {value: alpha2, selected: state.countryCode === alpha2 ? `selected` : false}}, [c])
}

function view({state$, components}) {
  return combineObj({state$, components$: combineObj(components)}).map(({state, components}) => {
    return div(`.address-section`, [
      div(`.country.sub-section`, [
        div(`.heading`, [h5([`Country`])]),
        div(`.content`, [
          select(`.appCountryInput`, [
            option(`.option`, {props: {value: undefined}}, [`Select country`]),
            ...countries.map(c => convertCountryToOption(c, state))
          ])
        ])
      ]),
      div(`.street.sub-section`, [
        div(`.heading`, [h5([`Street Address`])]),
        div(`.content`, [
          components.streetAddress
        ])
      ]),
      div(`.apt-suite-bldg.sub-section`, [
        div(`.heading`, [h5([`Apt, Suite, Bldg. (optional)`])]),
        div(`.content`, [
          input(`.appAptSuiteBldgInput.address-input`, {props: {type: `text`, value: state.aptSuiteBldg || ``}})
        ])
      ]),
      div(`.city.sub-section`, [
        div(`.heading`, [h5([`City`])]),
        div(`.content`, [
          input(`.appCityInput.address-input`, {props: {type: `text`, value: state.city || ``}})
        ])
      ]),
      div(`.stateAbbr.sub-section`, [
        div(`.heading`, [h5([`State`])]),
        div(`.content`, [
          input(`.appStateAbbrInput.address-input`, {props: {type: `text`, placeholder: `E.g. NY`, value: state.stateAbbr || ``}})
        ])
      ]),
      div(`.zipCode.sub-section`, [
        div(`.heading`, [h5([`Zip Code`])]),
        div(`.content`, [
          input(`.appZipCodeInput.address-input`, {props: {type: `text`, value: state.zipCode || ``}})
        ])
      ])
    ])
  })
}

export default function USAddress(sources, inputs) {

  const {listing$} = inputs
  const searchArea$ = listing$.map(x => x.profile.searchArea).publishReplay(1).refCount()
  const center$ = searchArea$.map(v => v.center).publishReplay(1).refCount()


  const autocomplete$ = createProxy()
  const streetAddress$ = createProxy()

  const actions = intent(sources)
  const state$ = model(actions, {autocomplete$, streetAddress$, searchArea$, ...inputs})

  const addressAutocompleteInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => ArcGISSuggest(sources, {
        props$: combineObj({
          countryCode$: state$.map(s => s.country),
          category: O.of('Address')
        }),
        center$,
        input$: inputs.input$
      }),
    itemConfigs: addressItemConfigs,
    displayFunction: x => extractStreetAddress(x.name),
    placeholder: `Start typing address here...`,
    initialText$: state$.map(s => s.street)
  })

  streetAddress$.attach(addressAutocompleteInput.input$)

  const magicKeyConverter = ArcGISGetMagicKey(sources, {
    props$: O.of({
      category: `location address`
    }),
    input$: addressAutocompleteInput.selected$
  })

  autocomplete$.attach(magicKeyConverter.result$)

  return {
    DOM: view({state$, components: {streetAddress$: addressAutocompleteInput.DOM}}),
    HTTP: O.merge(addressAutocompleteInput.HTTP, magicKeyConverter.HTTP),
    result$: state$
  }
}
