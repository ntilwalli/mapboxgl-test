import {Observable as O} from 'rxjs'
import {RRule, RRuleSet, rrulestr} from 'rrule'

export default function intent(sources, inputs) {
  const {Router} = sources

  const listing$ = Router.history$
    .take(1)
    .map(x => x.state)
    .publishReplay(1).refCount()

  return {
    listing$
  }
}
