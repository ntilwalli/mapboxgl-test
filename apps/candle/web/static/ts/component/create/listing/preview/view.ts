import {Observable as O} from 'rxjs'
import {div, a, pre, span, input, button} from '@cycle/dom'
import {combineObj} from '../../../../utils'
import {renderListingCard, renderSummary} from '../../../helpers/listing/render'

function renderButtons() {
  return div('.column', [
    div(`.section.row-no-wrap.align-center.justify-between`, [
      div(`.description-text`, [`Staging a listing allows you to invite/confirm performers before going live.  Would you like to stage this listing?`]),
      div('.flex.justify-center', [
        button(`.appStageButton.outline-button.green.medium-button`, [
          div('.flex.justify-center.align-center', [`Stage`])
        ])
      ])
    ]),
    div(`.section.row-no-wrap.align-center.justify-center.italic`, ['Or']),
    div(`.section.row-no-wrap.align-center.justify-between`, [
      div(`.description-text`, [`Posting this listing will allow you to distribute links to the associated event(s).  It also allows you to send out invitations and makes public events discoverable on search. Would you like to post this event?`]),
      div('.flex.justify-center', [
        button(`.appStageButton.outline-button.green.medium-button`, [
          div('.flex.justify-center.align-center', [`Post`])
        ])
      ])
    ])
  ])
}

export default function view(state$, components) {
  return combineObj({
      state$
    })
    .map((info: any) => {
      const {state} = info
      const {session} = state
      const {listing} = session
      return div(`.flex-grid.preview`, [
        //div(`.heading`, ['Preview listing']),
        div(`.body`, [
          div('.column.section', [
            div('.section-heading.text-item', ['Listing preview']),
            renderListingCard(listing),          
          ]),
          div('.column.section', [
            div('.section-heading.text-item', ['Interaction properties']),
            renderSummary(listing)    
          ]),
          div('.column.section', [
            div('.section-heading.text-item', ['Stage or post']),
            renderButtons()  
          ])
        ])
      ])
    })
}