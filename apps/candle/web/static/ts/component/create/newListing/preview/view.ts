import {Observable as O} from 'rxjs'
import {div, h6, a, pre, span, input, button} from '@cycle/dom'
import {combineObj} from '../../../../utils'
import {renderSummary} from '../../../helpers/listing/render'

import {
  renderName, renderNameWithParentLink, renderCuando, renderDonde, 
  renderCuandoStatus, renderCost, renderStageTime, renderPerformerSignup,
  renderPerformerLimit, renderTextList, renderNote, getFullCostAndStageTime,
  renderContactInfo
}  from '../../../helpers/listing/renderBootstrap'

function renderButtons() {
  return div('.row', [
    div('.col-12', [
      div('.row.mb-4', [
        div(`.col-12.d-fx-a-c`, [
          div('.mr-4', ['Staging a listing allows you to invite/confirm performers before going live.  Would you like to stage this listing?']),
          div(`.appStageButton.btn.btn-outline-warning.d-fx-a-c.fx-j-c`, {style: {height: "2rem", 'min-width': "5rem"}}, [`Stage`])
        ])
      ]),
      div('.row.mb-4', [
        div('.col-10.d-flex.fx-j-c.fw-bold', ['Or']),
      ]),
      div('.row', [
        div(`.col-12.d-fx-a-c`, [
          div('.mr-4', [`Posting makes your listing live, enabling you to distribute links/send out invitations and makes events discoverable on search. Would you like to post this event?`]),
          div(`.appPostButton.btn.btn-outline-success.d-fx-a-c.fx-j-c`, {style: {height: "2rem", 'min-width': "5rem"}}, [`Post`])
        ])
      ])
    ])
  ])
}

function renderBackButtons() {
  return div([
    button('.appGoToBasicsButton.btn.btn-link-underline.cursor-pointer.d-flex', {style: {"flex-flow": "row nowrap", flex: "0 0 fixed"}}, [
      span('.fa.fa-angle-double-left.mr-2.d-flex.align-items-center', []),
      span('.d-flex.align-items-center', ['Back to basic settings'])
    ]),
    button('.appGoToAdvancedButton.mt-1.btn.btn-link-underline.cursor-pointer.d-flex', {style: {"flex-flow": "row nowrap", flex: "0 0 fixed"}}, [
      span('.fa.fa-angle-double-left.mr-2.d-flex.align-items-center', []),
      span('.d-flex.align-items-center', ['Back to advanced settings'])
    ]),
  ])
}


function renderMarkerInfo(donde) {
  return div(`.marker-info`, [
    renderDonde(donde)
    //donde.name
  ])
}

export function renderRecurringListingPreview(state) {

  const {listing, children} = state
  const {type, donde, cuando, meta} = listing
  const {
    name, event_types, categories, notes, 
    performer_cost, description, contact_info, 
    performer_sign_up, stage_time, 
    performer_limit, listed_hosts, note
  } = meta

  const new_note = note ? note.replace(/\n/g, ' ') : undefined

  const [full_cost, full_stage_time, merged_cost_stage_time] = 
    getFullCostAndStageTime(performer_cost, stage_time)

  return div('.listing-card.pt-xs', [
    div('.row.mb-4', [
      div('.col-6.d-flex.flex-column', [
        renderName(name),
        renderCuando(listing),
        renderDonde(donde),
        renderContactInfo(contact_info)
      ]),
      div('.col-6.d-flex.flex-column', [
        full_cost ? full_cost : null,
        full_stage_time ? full_stage_time : null,
        performer_sign_up ? renderPerformerSignup(performer_sign_up) : null,
        performer_limit ? renderPerformerLimit(performer_limit) : null,
        categories.length ? renderTextList(categories) : null,
        // event_types.length ? div('.row.no-gutter', [
        //   renderTextList(event_types)
        // ]) : null
      ])
    ]),
    merged_cost_stage_time ? div('.row', [div('.col-12', [merged_cost_stage_time])]) : null,
    div('.row', [
      div('.col-12', [
        renderNote(new_note)
      ])
    ]),
    div(`.row.no-gutters.map-area`, [
      div('.col-12.h-100', [
        renderMarkerInfo(donde),
        div(`#location-map`)
      ])
    ]),
  ])
}


export function renderSingleListingPreview(state) {
  const {listing} = state
  const {type, donde, cuando, meta} = listing
  const {
    name, event_types, categories, notes, 
    performer_cost, description, contact_info, 
    performer_sign_up, stage_time, 
    performer_limit, listed_hosts, note} = meta

  const [full_cost, full_stage_time, merged_cost_stage_time] = 
    getFullCostAndStageTime(performer_cost, stage_time)

  const new_note = note ? note.replace(/\n/g, ' ') : undefined

  return div('.listing-card.pt-xs', [
    div('.row.mb-4', [
      div('.col-6.d-flex.flex-column', [
        renderNameWithParentLink(listing),
        renderCuando(listing),
        renderDonde(donde),
        renderContactInfo(contact_info),
      ]),
      div('.col-6.d-flex.flex-column', [
        renderCuandoStatus(cuando),
        full_cost ? full_cost : null,
        full_stage_time ? full_stage_time : null,
        performer_sign_up ? renderPerformerSignup(performer_sign_up) : null,
        performer_limit ? renderPerformerLimit(performer_limit) : null,
        categories.length ? renderTextList(categories) : null,
      ])
    ]),
    merged_cost_stage_time ? div('.row', [div('.col-12', [merged_cost_stage_time])]) : null,
    div('.row', [
      div('.col-12', [
        renderNote(new_note)
      ])
    ]),
    div(`.row.no-gutter.map-area`, [
      renderMarkerInfo(donde),
      div(`#location-map`)
    ])
  ])
}

export default function view(info) {
  const {state} = info
  const {session} = state
  const {listing} = session
  const {type} = listing
  return div(`.preview.appMainPanel`, [
    //div(`.heading`, ['Preview listing']),
    div(`.row.mb-4`, [
      div('.col-12', [
        type === "single" ? renderSingleListingPreview(session) : renderRecurringListingPreview(session)         
      ]),
    ]),
    div('.row.mb-4', [
      div('.col-12', [
        h6('.mb-xs', ['Interaction properties']),
        renderSummary(listing)    
      ]),
    ]),
    div('.row.mb-4', [
      div('.col-12', [
        renderBackButtons()    
      ]),
    ]),
    div('.row', [
      div('.col-12', [
        h6('.mb-xs', ['Stage or post']),
        renderButtons()  
      ])
    ])
  ])
}