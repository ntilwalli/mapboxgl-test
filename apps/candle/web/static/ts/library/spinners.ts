import {div} from '@cycle/dom'

export function renderBounceSpinnerSmall() {
  return div('.bounce-spinner-small', [
    div('.bounce1', []), div('.bounce2', []), div('.bounce2', [])
  ])
}

export function renderSKFadingCircle() {
  return div('.sk-fading-circle', [
    div('.sk-circle1.sk-circle', []), 
    div('.sk-circle2.sk-circle', []), 
    div('.sk-circle3.sk-circle', []),
    div('.sk-circle4.sk-circle', []), 
    div('.sk-circle5.sk-circle', []), 
    div('.sk-circle6.sk-circle', []),
    div('.sk-circle7.sk-circle', []), 
    div('.sk-circle8.sk-circle', []), 
    div('.sk-circle9.sk-circle', []),
    div('.sk-circle10.sk-circle', []), 
    div('.sk-circle11.sk-circle', []), 
    div('.sk-circle12.sk-circle', [])
  ])
}

export function renderSKFadingCircle6() {
  return div('.sk-fading-circle-6', [
    div('.sk-circle1.sk-circle', []), 
    div('.sk-circle2.sk-circle', []), 
    div('.sk-circle3.sk-circle', []),
    div('.sk-circle4.sk-circle', []), 
    div('.sk-circle5.sk-circle', []), 
    div('.sk-circle6.sk-circle', [])
  ])
}