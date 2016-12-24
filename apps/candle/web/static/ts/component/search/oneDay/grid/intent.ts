import {Observable as O} from 'rxjs'
import {targetIsOwner} from '../../../../utils'
export default function intent(sources) {
  const {DOM} = sources
  
  const click$ = DOM.select(`.appResult`).events(`click`)
    .filter((ev: any) => ev.target.tagName !== 'A')
    .map((ev: any) => ev.ownerTarget.searchResult)
    .publishReplay(1).refCount()
  
  //click$.subscribe(x => console.log(`result clicked: `, x))

  return {
    click$
  }
}

