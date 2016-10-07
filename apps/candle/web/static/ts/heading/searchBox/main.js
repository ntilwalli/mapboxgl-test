import xs from 'xstream'
import {div, span, input, i} from '@cycle/dom'
import {noopListener, attrs} from '../../utils'

export default function main(sources, inputs) {

    return {
      DOM: xs.of({
        large: div(`.comp.pull-xs-left.search-area`, [
          span(`.fa.fa-search.search-area-icon`),
          input(
            `.appSearchBox.search-box`,
            attrs({
              type: `text`,
              placeholder: `Search by category`
            })
          ),
          span(`.appSearchConfiguration.search-area-icon.fa.fa-gear.icon`)
        ]),
        small: div(`.comp.search-area`, [
          i(`.fa.fa-search.search-area-icon`),
          input(
            `.search-box`,
            attrs({
              type: `text`,
              placeholder: `Search by category`
            })
          ),
          i(`.fa.fa-gear.search-area-icon`)
        ])
      }),
      message$: xs.never()
    }

}
