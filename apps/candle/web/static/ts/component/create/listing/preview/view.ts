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
    div('.col-xs-12', [
      div('.row.mb-1', [
        div(`.col-xs-12.d-fx-a-c`, [
          div('.mr-1', ['Staging a listing allows you to invite/confirm performers before going live.  Would you like to stage this listing?']),
          div(`.appStageButton.btn.btn-outline-warning.d-fx-a-c.fx-j-c`, {style: {height: "2rem", 'min-width': "5rem"}}, [`Stage`])
        ])
      ]),
      div('.row.mb-1', [
        div('.col-xs-10.d-flex.fx-j-c.fw-bold', ['Or']),
      ]),
      div('.row', [
        div(`.col-xs-12.d-fx-a-c`, [
          div('.mr-1', [`Posting makes your listing live, enabling you to distribute links/send out invitations and makes events discoverable on search. Would you like to post this event?`]),
          div(`.appStageButton.btn.btn-outline-success.d-fx-a-c.fx-j-c`, {style: {height: "2rem", 'min-width': "5rem"}}, [`Post`])
        ])
      ])
    ])
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
    div('.row.mb-1', [
      div('.col-xs-6', [
        div('.row', [
          div('.col-xs-12', [
            renderName(name)
          ])
        ]),
        div('.row', [
          div('.col-xs-12', [
            renderCuando(listing)
          ])
        ]),
        div('.row', [
          div('.col-xs-12', [
            renderDonde(donde)
          ])
        ]),
        div('row', [
          div('.col-xs-12', [
            renderContactInfo(contact_info)
          ])
        ])
      ]),
      div('.col-xs-6', [
        full_cost ? div('.row.clearfix', [
          div('.col-xs-12', [
            full_cost
          ])
        ]) : null,
        full_stage_time ? div('.row.clearfix', [
          div('.col-xs-12', [
            full_stage_time
          ])
        ]) : null,
        performer_sign_up ? div('.row.clearfix', [
          div('.col-xs-12', [
            renderPerformerSignup(performer_sign_up)
          ])
        ]) : null,
        performer_limit ? div('.row.clearfix', [
          div('.col-xs-12', [
            renderPerformerLimit(performer_limit)
          ])
        ]) : null,
        categories.length ? div('.row.clearfix', [
          div('.col-xs-12', [
            renderTextList(categories)
          ])
        ]) : null,
        // event_types.length ? div('.row.no-gutter.clearfix', [
        //   renderTextList(event_types)
        // ]) : null
      ])
    ]),
    merged_cost_stage_time ? div('.row', [div('.col-xs-12', [merged_cost_stage_time])]) : null,
    div('.row', [
      div('.col-xs-12', [
        renderNote(new_note)
      ])
    ]),
    div(`.row.no-gutter.map-area`, [
      div('.col-xs-12.no-gutter.h-100', [
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
    div('.row.mb-1', [
      div('.col-xs-6', [
        div('.row', [
          div('.col-xs-12', [
            renderNameWithParentLink(listing)
          ])
        ]),
        div('.row', [
          div('.col-xs-12', [
            renderCuando(listing)
          ])
        ]),
        div('.row', [
          div('.col-xs-12', [
            renderDonde(donde)
          ])
        ]),
        div('.row', [
          div('.col-xs-12', [
            renderContactInfo(contact_info)
          ])
        ])
      ]),
      div('.col-xs-6', [
        div('.row.clearfix', [
          div('.col-xs-12', [
            renderCuandoStatus(cuando)
          ])
        ]),
        full_cost ? div('.row.clearfix', [
          div('.col-xs-12', [
            full_cost
          ])
        ]) : null,
        full_stage_time ? div('.row.clearfix', [
          div('.col-xs-12', [
            full_stage_time
          ])
        ]) : null,
        performer_sign_up ? div('.row.clearfix', [
          div('.col-xs-12', [
            renderPerformerSignup(performer_sign_up)
          ])
        ]) : null,
        performer_limit ? div('.row.clearfix', [
          div('.col-xs-12', [
            renderPerformerLimit(performer_limit)
          ])
        ]) : null,
        categories.length ? div('.row.clearfix', [
          div('.col-xs-12', [
            renderTextList(categories)
          ])
        ]) : null,
      ])
    ]),
    merged_cost_stage_time ? div('.row', [div('.col-xs-12', [merged_cost_stage_time])]) : null,
    div('.row', [
      div('.col-xs-12', [
        renderNote(new_note)
      ])
    ]),
    div(`.row.no-gutter.map-area.h-100`, [
      renderMarkerInfo(donde),
      div(`#location-map`)
    ])
  ])
}


// export function renderListingCard(listing) {
//   const {type, donde, meta} = listing
//   const {name, event_types, categories, notes, performer_cost, description, contact_info, performer_sign_up, stage_time, performer_limit, listed_hosts} = meta

//   return div(`.listing-card`, [
//     div('.column.meta', [
//       div(`.row.justify-between`, [
//         div(`.column`, [
//           renderName(name),
//           renderCuando(listing),
//           renderDonde(donde),
//           renderContactInfo(contact_info),
//           //renderListedHosts(listed_hosts)
//         ]),
//         div(`.column`, [
//           renderCost(listing),
//           renderStageTime(stage_time),
//           performer_sign_up ? renderPerformerSignup(performer_sign_up) : null,
//           performer_limit ? renderPerformerLimit(performer_limit) : null,
//           renderEventTypesAndCategories(event_types, categories)
//           // checked_in ? div(`.result-check-in`, [`Checked-in`]) : null
//         ])
//       ]),
//       renderDescription(description),
//       renderNotes(notes)
//     ]),
//     div(`.map`, [
//       div(`#location-map`, []),
//       renderLocationInfo(donde)
//     ])
//   ])
// }



export default function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {session} = state
      const {listing} = session
      const {type} = listing
      return div(`.preview`, [
        //div(`.heading`, ['Preview listing']),
        div(`.row.mb-1`, [
          div('.col-xs-12', [
            type === "single" ? renderSingleListingPreview(session) : renderRecurringListingPreview(session)         
          ]),
        ]),
        div('.row.mb-1', [
          div('.col-xs-12', [
            h6('.mb-xs', ['Interaction properties']),
            renderSummary(listing)    
          ]),
        ]),
        div('.row', [
          div('.col-xs-12', [
            h6('.mb-xs', ['Stage or post']),
            renderButtons()  
          ])
        ])
      ])
    })
}