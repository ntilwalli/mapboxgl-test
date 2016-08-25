import xs from 'xstream'
import {div} from '@cycle/DOM'
import isolate from '@cycle/isolate'
import combineObj from '../../combineObj'
import {noopListener} from '../../utils'

function main(sources, inputs) {

  return {
    DOM: xs.of(div(`.mapboxMap`, {
      style: {
        height: 100%;
        width: 100%;
      }
    }))
  }
}

export default (sources, inputs) => isolate(main)(sources, inputs)
