import {Observable as O} from 'rxjs'
import {div, h6, h4, a, pre, span, input, button} from '@cycle/dom'
import {combineObj} from '../../../../utils'
import {renderSummary} from '../../../helpers/listing/render'

import {
  renderName, renderNameWithParentLink, renderCuando, renderDonde, 
  renderCuandoStatus, renderStatus, renderCost, renderStageTime, renderPerformerSignup,
  renderPerformerLimit, renderParticipantLimit, renderTextList, renderNote, getFullCostAndStageTime,
  renderContactInfo, isOpenMic, isShow
}  from '../../../helpers/listing/renderBootstrap'

function renderAuthorizationButtons(state) {
  return div('.authorization-section', {style: {display: state.authorization ? 'none' : 'flex'}}, [
    div('.d-flex.flex-column.overlay', [
      div('.mb-4', ["You must be logged in to post a listing.  Sign-up or login now and we'll bring you right back here.  Don't worry you won't lose any work."]),
      div('.d-flex.justify-content-around', [
        button(`.appLoginButton.btn.btn-outline-success.d-fx-a-c.fx-j-c.p-0`, {style: {height: "2rem", 'min-width': "5rem"}}, [
          div('.d-flex.justify-content-center.align-items-center.h-100.w-100', [
            `Log-in`
          ])
        ]),
        button(`.appSignupButton.btn.btn-outline-success.d-fx-a-c.fx-j-c.p-0`, {style: {height: "2rem", 'min-width': "5rem"}}, [
          div('.d-flex.justify-content-center.align-items-center.h-100.w-100', [
            `Sign-up`
          ])
        ])
      ])
    ])
  ])
}

function renderPostStageButtons(state) {
  const {authorization} = state
  const disabled = !authorization
  return div('.pos-relative', [
    div('.row',  {class: {disabled}}, [
      div('.col-12', [
        //h4('.mb-xs', ['Stage or post']),
        h4('.mb-xs', ['Post']),
        // div('.row.mb-4', [
        //   div(`.col-12.d-fx-a-c`, [
        //     div('.mr-4', ['Staging a listing allows you to invite/confirm performers before going live.  Would you like to stage this listing?']),
        //     button(`.appStageButton.btn.btn-outline-warning.d-fx-a-c.fx-j-c.p-0`, {class: {disabled}, attrs: {disabled}, style: {height: "2rem", 'min-width': "5rem"}}, [
        //       div('.d-flex.justify-content-center.align-items-center.h-100.w-100', [
        //         `Stage`
        //       ])
        //     ])
        //   ])
        // ]),
        // div('.row.mb-4', [
        //   div('.col-10.d-flex.fx-j-c.fw-bold', ['Or']),
        // ]),
        div('.row', [
          div(`.col-12.d-fx-a-c`, [
            div('.mr-4', [`Posting makes your listing (and it's recurrences) live, enabling you to distribute links/send out invitations and makes events discoverable on search. Once posted a listing can only be canceled. Would you like to post this event?`]),
            button(`.appPostButton.btn.btn-outline-success.d-fx-a-c.fx-j-c.p-0`, {class: {disabled}, attrs: {disabled}, style: {height: "2rem", 'min-width': "5rem"}}, [
              div('.d-flex.justify-content-center.align-items-center.h-100.w-100', [
                `Post`
              ])
            ])
          ])
        ])
      ])
    ]),
    renderAuthorizationButtons(state)
  ])
}



function renderButtons(state) {
  //return state.authorization ? renderPostStageButtons(state) : renderAuthorizationButtons(state)
  return renderPostStageButtons(state)
}

function renderBackButtons() {
  return div([
    button('.appGoToBasicsButton.btn.btn-link.cursor-pointer.d-flex', {style: {"flex-flow": "row nowrap", flex: "0 0 fixed"}}, [
      span('.fa.fa-angle-double-left.mr-2.d-flex.align-items-center', []),
      span('.d-flex.align-items-center', ['Back to basic settings'])
    ]),
    button('.appGoToAdvancedButton.mt-1.btn.btn-link.cursor-pointer.d-flex', {style: {"flex-flow": "row nowrap", flex: "0 0 fixed"}}, [
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
    performer_limit, listed_hosts, note, participant_cost,
    participant_limit
  } = meta

  const new_note = note ? note.replace(/\n/g, ' ') : undefined

  const [full_cost, full_stage_time, merged_cost_stage_time] = 
    getFullCostAndStageTime(performer_cost, stage_time, participant_cost, listing)

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
        participant_limit ? renderParticipantLimit(performer_limit) : null,
        event_types.length ? renderTextList(event_types) : null,
        categories.length ? renderTextList(categories) : null
      ])
    ]),
    merged_cost_stage_time ? div('.row', [div('.col-12', [merged_cost_stage_time])]) : null,
    div('.row', [
      div('.col-12', [
        renderNote(new_note)
      ])
    ]),
    div('.row.no-gutters.map-area', [
      div('.col-12.h-100', [
        renderMarkerInfo(donde),
        div('#location-map')
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
    performer_limit, listed_hosts, note, participant_cost,
    participant_limit
  } = meta

  const [full_cost, full_stage_time, merged_cost_stage_time] = 
    getFullCostAndStageTime(performer_cost, stage_time, participant_cost, listing)

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
        renderStatus(listing),
        full_cost ? full_cost : null,
        full_stage_time ? full_stage_time : null,
        performer_sign_up ? renderPerformerSignup(performer_sign_up) : null,
        performer_limit ? renderPerformerLimit(performer_limit) : null,
        participant_limit ? renderParticipantLimit(performer_limit) : null,
        event_types.length ? renderTextList(event_types) : null,
        categories.length ? renderTextList(categories) : null,
      ])
    ]),
    merged_cost_stage_time ? div('.row', [div('.col-12', [merged_cost_stage_time])]) : null,
    div('.row', [
      div('.col-12', [
        renderNote(new_note)
      ])
    ]),
    div('.row.no-gutter.map-area', [
      renderMarkerInfo(donde),
      div('#location-map')
    ])
  ])
}

export default function view(info) {
  const {state} = info
  const {session} = state
  const {listing} = session
  const {type} = listing
  const disabled = !state.authorization
  return div('.preview.appMainPanel', [
    //div(`.heading`, ['Preview listing']),
    div('.row.mb-4', [
      div('.col-12', [
        renderBackButtons()    
      ]),
    ]),
    div('.row.mb-4', [
      div('.col-12', [
        type === 'single' ? renderSingleListingPreview(session) : renderRecurringListingPreview(session)         
      ]),
    ]),
    isOpenMic(listing) ? div('.row.mb-4', [
      div('.col-12', [
        h6('.mb-xs', ['Interaction properties']),
        renderSummary(listing)    
      ]),
    ]) : null,
    div('.row', [
      div('.col-12', [
        renderButtons(state)  
      ])
    ])
  ])
}