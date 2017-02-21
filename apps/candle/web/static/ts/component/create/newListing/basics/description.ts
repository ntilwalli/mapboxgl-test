import {Observable as O} from 'rxjs'
import {div} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify} from '../../../../utils'

import TextAreaInput from '../../../../library/bootstrapTextAreaInputGated'

const name_input_props = {
  placeholder: `Type description here`,
  name: `listing-name`,
  style_class: `.name-input.form-control`,
  empty_is_error: true,
}

function applyChange(session, val) {
  session.listing.meta.description = val
}

export default function main(sources, inputs) {

  const out = isolate(TextAreaInput)(sources, {
    props$: O.of(name_input_props),
    initial_text$: inputs.session$.map(s => {
      return s.listing.meta.description
    }),
    highlight_error$: inputs.highlight_error$ || O.of(true)
  })

  return {
    ...out,
    output$: out.output$.map(val => {
      return {
        ...val,
        apply: applyChange,
        errors: val.errors.map(x => 'Description: ' + x)
      }
    }).publishReplay(1).refCount()
  }
}