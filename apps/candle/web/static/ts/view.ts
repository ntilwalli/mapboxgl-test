import {div} from '@cycle/dom'
import {combineObj} from './utils'

function view(state$, components, history$) {
  const dom$ = combineObj({
    state$, 
    components$: combineObj(components),  
    history$
  }).debounceTime(0)
    .map((info: any) => {
      const {state, components, history} = info
      const {content, modal} = components
      //state.modal ? console.log(modal) : null
      return div(`.root-container`, 
      {
        update: (old, {elm}) => {
          console.log('update... history', history)
          //window.scrollTo(0, 0)
        }
      },
      [
        //state.modal && state.modal === 'leftMenu' ? undefined : 
        content,
        state.modal ? modal : null
      ])
    })

  return dom$
}

export default view