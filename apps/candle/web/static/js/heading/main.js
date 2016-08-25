import xs from 'xstream'
import {div, nav} from '@cycle/dom'
import combineObj from '../combineObj'
import {noopListener} from '../utils'

export default function main(sources, inputs, props = {}) {
  const transformed$ = inputs.props$.map(components => {
    const transformed = components.map(c => {
      const name = c.name

      const component = c.component(sources, {
        parentState$: inputs.parentState$ ? inputs.parentState$ : xs.of(undefined),
        message$: inputs.message$ ? inputs.message$ : xs.never()
      })

      return {
        DOM: component.DOM,
        message$: component.message$
        // .map(data => ({
        //   type: name,
        //   data
        // }))
      }
    })

    return transformed
  }).remember()


  return {
    DOM: transformed$
      .map(components => {
        return xs.combine(...components.map(c => c.DOM))
      })
      .flatten()
      .map(children => div(`.nav-section${props.isFixed ? '.fixed' : ''}`, [
        nav(`.nav.nav-inline.hidden-sm-down`, children.map(c => c.large)),
        nav(`.nav.nav-inline.hidden-md-up`, children.map(c => c.small))
      ])),
    message$: transformed$
      .map(components => {
        //console.log(components)
        return xs.merge(...components.map(c => {
          //console.log(c)
          return c.message$
        }))
      })
      .flatten()
  }
}
