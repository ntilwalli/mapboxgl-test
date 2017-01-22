import {Observable as O} from 'rxjs'
import {div, h6, span} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {combineObj, mergeSinks, componentify, getPreferredRegion$} from '../../../../../utils'

import DoneModal from '../../../../../library/doneModal'
import SearchAreaContent from './searchAreaContent'

function applyDone(session, val) {
  session.properties.donde.search_area = val
  session.properties.donde.modal = undefined
}

function applyChange(session, val) {
  session.properties.donde.search_area = val,
  session.properties.donde.modal = 'search_area'
}

function applySimple(session, val) {
  session.properties.donde.search_area = val
}

function applyClose(session, val) {
  session.properties.donde.modal = undefined
}


function renderSearchArea(search_area) {
  const {region} = search_area
  const {city_state} = region
  const {city, state_abbr} = city_state
  const sa = `${city}, ${state_abbr}`

  return div(`.form-group`, [
    h6([`Search area`]),
    div(`.col-form-static`, [
      span([sa]),
      span(`.appChangeSearchAreaButton.btn.btn-link.ml-4.v-align-initial`, [`change`])
    ])
  ])
}

export default function main(sources, inputs) {

  const preferred$ = combineObj({
    session$: inputs.session$,
    preferred$: getPreferredRegion$(inputs).take(1)
  }).publishReplay(1).refCount()

  const content$ = preferred$
    .map((info: any) => { 
      const {session, preferred} = info
      const sa = session.properties.donde.search_area ? session.properties.donde.search_area : {region: preferred, radius: 10000}
      if (session.properties.donde.modal === `search_area`) {
        const out = DoneModal(sources, {
          ...inputs,
          content: (sources, inputs) => SearchAreaContent(sources, inputs),
          props$: O.of({title: `Change Search Area`, styleClass: `.sign-up-height`}),
          initialState$: O.of(sa)
        })

        return {
          ...out,
          output$: O.merge(
            out.done$
              .map(sa => {
                return {
                  data: sa,
                  valid: true,
                  errors: [],
                  apply: applyDone
                }
              }),
            out.close$.map(_ => {
                return {
                  data: sa,
                  valid: true,
                  errors: [],
                  apply: applyClose
                }
              })
              .startWith({
                data: sa,
                valid: true,
                errors: [],
                apply: applySimple
              })
          )
        }
      } else {
        return {
          DOM: O.of(renderSearchArea(sa)),
          output$: sources.DOM.select('.appChangeSearchAreaButton').events('click')
            .map(x => {
              return {
                data: sa,
                valid: true,
                errors: [],
                apply: applyChange
              }
            })
            .startWith({
              data: sa,
              valid: true,
              errors: [],
              apply: applySimple
            })
        }
      }
    }).publishReplay(1).refCount()

  const content = {
    ...componentify(content$),
    output$: content$.switchMap((x: any) => x.output$)
      .map(x => {
        return x
      })
  }

  return content
}