import xs from 'xstream'
import combineObj from 'xs-combine-obj'
import {div, input, select, option, h5, li, span} from '@cycle/dom'
import Immutable from 'immutable'
import {countryToAlpha2} from '../../../../util/countryCodes.js'
import {getState} from '../../../../util/states'

import AutocompleteInput from '../../../../general/autocompleteInput'
import ArcGISSuggest from '../../../../service/ArcGISSuggest'
import ArcGISGetMagicKey from '../../../../service/ArcGISGetMagicKey'

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
        return `Error`
      }
    }

function intent({DOM}, inputs) {
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

  const countryCodeReducer$ = actions.countryCode$.map(cc => state => {
    return state.set(`countryCode`, cc)
  })

  // const streetReducer$ = inputs.streetAddress$.map(val => state => {
  //   const street = extractStreetAddress(val)
  //   return state.set(`street`, street)
  // })

  const aptSuiteBldgReducer$ = actions.aptSuiteBldg$.map(val => state => {
    return state.set(`aptSuiteBldg`, val)
  })

  const cityReducer$ = actions.city$.map(val => state => {
    return state.set(`aptSuiteBldg`, val)
  })

  const stateAbbrReducer$ = actions.stateAbbr$.map(val => state => {
    return state.set(`stateAbbr`, val)
  })

  const zipCodeReducer$ = actions.zipCode$.map(val => state => {
    return state.set(`zipCode`, val)
  })

  const autocompleteReducer$ = inputs.autocomplete$.map(sa => state => {
    // console.log(`street address reducer`)
    // console.log(sa.data)
    const pa = sa.data.parsedAddress
    const street = extractStreetAddress(sa.data.address)
    const stateAbbr = getState(pa.state)
    return state
      .set(`city`, pa.city)
      .set(`zipCode`, pa.zip)
      .set(`stateAbbr`, stateAbbr)
      .set(`street`, street)
      .set(`latLng`, {
        type: `auto`,
        data: sa.data.latLng
      })
  })

  return xs.merge(
    countryCodeReducer$,
    //streetAddressReducer$,
    aptSuiteBldgReducer$,
    cityReducer$,
    stateAbbrReducer$,
    zipCodeReducer$,
    autocompleteReducer$
  )
}



function model(actions, inputs) {
  const {props$, vicinity$} = inputs
  return combineObj({
      props$: props$.take(1),
      listing$: inputs.listing$.take(1),
      vicinity$: vicinity$.take(1)
    })
    .map(({props, listing, vicinity}) => {
      const info = listing.location.info
      const cc = vicinity.region.type === `somewhere` ? vicinity.region.data.country : undefined
      const initialState = {
        countryCode: cc,
        street: info && info.street || undefined,
        aptSuiteBldg: info && info.aptSuiteBldg || undefined,
        city: info && info.city || undefined,
        stateAbbr: info && info.stateAbbr || undefined,
        zipCode: info && info.zipCode || undefined,
        latLng: info && info.latLng || undefined
      }

      return reducers(actions, inputs)
        .fold((state, reducer) => reducer(state), Immutable.Map(initialState))
    })
    .flatten()
    .map(x => x.toJS())
    //.debug(`Address state...`)
    .remember()
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
          input(`.appStateAbbr.address-input`, {props: {type: `text`, placeholder: `E.g. NY`, value: state.stateAbbr || ``}})
        ])
      ]),
      div(`.zipCode.sub-section`, [
        div(`.heading`, [h5([`Zip Code`])]),
        div(`.content`, [
          input(`.appZipCode.address-input`, {props: {type: `text`, value: state.zipCode || ``}})
        ])
      ])
    ])
  })
}

export default function  USAddress(sources, inputs) {

  const {vicinity$} = inputs
  const centerZoom$ = vicinity$.map(v => v.position)


  const autocomplete$ = xs.create()
  const streetAddress$ = xs.create()

  const actions = intent(sources, inputs)
  const state$ = model(actions, {autocomplete$, streetAddress$, ...inputs})

  const addressAutocompleteInput = AutocompleteInput(sources, {
    suggester: (sources, inputs) => ArcGISSuggest(sources, {
        props$: combineObj({
          countryCode$: state$.map(s => s.country),
          category: xs.of('Address')
        }),
        centerZoom$,
        input$: inputs.input$
      }),
    itemConfigs: addressItemConfigs,
    displayFunction: x => extractStreetAddress(x.name),
    placeholder: `Start typing address here...`,
    initialText$: state$.map(s => s.street).debug(`hidy ho`)
  })

  streetAddress$.imitate(addressAutocompleteInput.input$)

  const magicKeyConverter = ArcGISGetMagicKey(sources, {
    props$: xs.of({}),
    input$: addressAutocompleteInput.selected$
  })

  autocomplete$.imitate(magicKeyConverter.result$)

  return {
    DOM: view({state$, components: {streetAddress$: addressAutocompleteInput.DOM}}),
    HTTP: xs.merge(addressAutocompleteInput.HTTP, magicKeyConverter.HTTP),
    result$: state$
  }
}
