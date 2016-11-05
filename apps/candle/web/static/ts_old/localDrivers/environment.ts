import {Observable as O} from 'rxjs'

export default function environmentDriver() {
  return O.create(observer => {
    observer.next({
      type: `environment`,
      data: {
        userAgent: navigator.userAgent
      }
    })
  })
  .map(x => {
    return x
  })
  .publishReplay(1).refCount()
}