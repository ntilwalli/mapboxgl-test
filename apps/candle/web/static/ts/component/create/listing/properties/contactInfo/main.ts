import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input} from '@cycle/dom'
import {combineObj, createProxy, traceStartStop} from '../../../../../utils'
import {TextInputComponent, EmailInputComponent, URLInputComponent, TwitterInputComponent} from '../helpers'
import clone = require('clone')

export default function main(sources, inputs) {
  const component_id = 'Contact info'
  const shared$ = inputs.props$.take(1)
    .map(props => {
      if (props) {
        return props
      } else {
        return {
          email: undefined,
          twitter: undefined,
          facebook: undefined,
          instagram: undefined
        }
      }
    })
    .publishReplay(1).refCount()

  const email_props = {
    placeholder: `E-mail`,
    name: `email-input`,
    styleClass: `.text-input`,
    emptyIsError: false
  }

  const email_component = EmailInputComponent(sources, shared$.pluck('email'), component_id, email_props)

  const twitter_props = {
    placeholder: `Twitter handle`,
    name: `twitter-input`,
    styleClass: `.text-input`,
    emptyIsError: false
  }

  const twitter_component = TwitterInputComponent(sources, shared$.pluck('twitter'), component_id, twitter_props)

  const facebook_props = {
    placeholder: `Facebook page`,
    name: `facebook-input`,
    styleClass: `.url-input`,
    emptyIsError: false
  }

  const facebook_component = URLInputComponent(sources, shared$.pluck('facebook'), component_id, facebook_props)

  const instagram_props = {
    placeholder: `Instagram handle`,
    name: `facebook-input`,
    styleClass: `.text-input`,
    emptyIsError: false
  }

  const instagram_component = TextInputComponent(sources, shared$.pluck('instagram'), component_id, instagram_props)

  const vtree$ = combineObj({
    email: email_component.DOM,
    twitter: twitter_component.DOM,
    facebook: facebook_component.DOM,
    instagram: instagram_component.DOM
  }).debounceTime(0).map((components: any) => {
    return div('.column', [
      div('.sub-heading.section-heading', ['Contact info']),
      div('.row', [
        div('.sub-sub-heading.item.flex.align-center', ['E-mail']),
        components.email
      ]),
      div('.row', [
        div('.sub-sub-heading.item.flex.align-center', ['Twitter']),
        components.twitter
      ]),
      div('.row', [
        div('.sub-sub-heading.item.flex.align-center', ['Facebook']),
        components.facebook
      ]),
      div('.row', [
        div('.sub-sub-heading.item.flex.align-center', ['Instagram']),
        components.instagram
      ])
    ])
  })

  const output$ = combineObj({
    email: email_component.output$,
    twitter: twitter_component.output$,
    facebook: facebook_component.output$,
    instagram: instagram_component.output$
  }).debounceTime(0).map((components: any) => {
    const {email, twitter, facebook, instagram} = components
    return {
      errors: email.errors.concat(twitter.errors).concat(facebook.errors).concat(instagram.errors),
      valid: email.valid && twitter.valid && facebook.valid && instagram.valid,
      data: {
        email: email.data,
        twitter: twitter.data,
        facebook: facebook.data,
        instagram: instagram.data
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}



  // const out = EnableWaitlistComponent(sources, O.of(true))

  // return {
  //   ...out,
  //   output$: out.output$
  //     .map(x => ({data: x, errors: [], valid: true}))

  // return type_component 

  // //return type_componen 