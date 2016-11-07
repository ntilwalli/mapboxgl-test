import {Observable as O} from 'rxjs'

const LEFTMENU_INDICATOR = `leftMenu`

export default function PassThrough(sources, inputs) {
  const leftMenuMessage$ = inputs.message$
    .map(x => {
      return x
    })
    .filter(x => x.type === LEFTMENU_INDICATOR)

  return {
    message$: leftMenuMessage$
  }
}
