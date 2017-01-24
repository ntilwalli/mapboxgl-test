import {Observable as O} from 'rxjs'
import {div, label, h6, span, input} from '@cycle/dom'
import isolate from '@cycle/isolate'
import Immutable = require('immutable')
import {combineObj, mergeSinks, componentify} from '../../../../utils'
import {ListingTypes} from '../../../../listingTypes'

function applyChange(session, val) {
  session.listing.type = val
}

export default function main(sources, inputs) {

  const click$ = sources.DOM.select('.appListingTypeInput').events('click').map(ev => ev.target.value)

  const type$ = inputs.session$
    .map((session: any) => {
      return session.listing.type
    })

  const vtree$ = type$
    .map(type => {
      return div([
        div('.form-check.form-check-inline.mb-0', [
          label('.form-check-label', [
            input(`.appListingTypeInput.form-check-input`, {attrs: {type: 'radio', name: 'listingTypes', value: ListingTypes.SINGLE, checked: type === ListingTypes.SINGLE}}, []),
            span('.ml-xs', ['single'])
          ]),
        ]),
        div('.form-check.form-check-inline.mb-0', [
          label('.form-check-label', [
            input(`.appListingTypeInput.form-check-input`, {attrs: {type: 'radio', name: 'listingTypes', value: ListingTypes.RECURRING, checked: type === ListingTypes.RECURRING}}, []),
            span('.ml-xs', ['recurring'])
          ])
        ])
      ])
    })

  return {
    DOM: vtree$,
    output$: O.merge(type$, click$)
      .map(type => {
        return {
          data: type,
          apply: applyChange,
          valid: true,
          errors: []
        }
      }).publishReplay(1).refCount()
  }
}