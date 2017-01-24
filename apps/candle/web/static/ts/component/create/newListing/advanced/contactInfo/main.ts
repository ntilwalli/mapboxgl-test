import {Observable as O} from 'rxjs'
import isolate from '@cycle/isolate'
import {div, span, input, h6, em} from '@cycle/dom'
import {combineObj, createProxy, traceStartStop} from '../../../../../utils'
import {TextInputComponent, EmailInputComponent, URLInputComponent, TwitterInputComponent} from '../helpers'
import clone = require('clone')

export function getDefault() {
  return {
    email: undefined,
    twitter: undefined,
    facebook: undefined,
    instagram: undefined
  }
}

export default function main(sources, inputs) {
  const component_id = 'Contact info'
  const shared$ = inputs.props$.take(1)
    .map(props => {
      return props || getDefault()
    })
    .publishReplay(1).refCount()

  const email_props = {
    placeholder: `E-mail`,
    name: `email-input`,
    styleClass: `.form-control.text-input`,
    emptyIsError: false
  }

  const email_component = EmailInputComponent(sources, shared$.pluck('email'), component_id + ': Invalid e-mail', email_props)

  const twitter_props = {
    placeholder: `Twitter handle`,
    name: `twitter-input`,
    styleClass: `.form-control.text-input`,
    emptyIsError: false
  }

  const twitter_component = TwitterInputComponent(sources, shared$.pluck('twitter'), component_id + ': Invalid Twitter', twitter_props)

  const facebook_props = {
    placeholder: `Facebook page`,
    name: `facebook-input`,
    styleClass: `.form-control.url-input`,
    emptyIsError: false
  }

  const facebook_component = URLInputComponent(sources, shared$.pluck('facebook'), component_id + ': Invalid Facebook', facebook_props)

  const instagram_props = {
    placeholder: `Instagram handle`,
    name: `facebook-input`,
    styleClass: `.form-control.text-input`,
    emptyIsError: false
  }

  const instagram_component = isolate(TextInputComponent)(sources, shared$.pluck('instagram'), component_id + ': Invalid Instagram', instagram_props)

  const website_props = {
    placeholder: `Website`,
    name: `website-input`,
    styleClass: `.form-control.url-input`,
    emptyIsError: false
  }

  const website_component = URLInputComponent(sources, shared$.pluck('website'), component_id + ': Invalid website', website_props)


  const vtree$ = combineObj({
    email: email_component.DOM,
    twitter: twitter_component.DOM,
    facebook: facebook_component.DOM,
    instagram: instagram_component.DOM,
    website: website_component.DOM
  }).debounceTime(0).map((components: any) => {
    return div('.card.card-block', [
      h6('.card-title', ['Contact info']),
      div('.row.mb-xs', [
        div('.col-12.raw-line', [
          em('.mr-4', ['E-mail']),
          components.email
        ])
      ]),
      div('.row.mb-xs', [
        div('.col-12.raw-line', [
          em('.mr-4', ['Website']),
          components.website
        ])
      ]),
      div('.row.mb-xs', [
        div('.col-12.raw-line', [
          em('.mr-4', ['Twitter']),
          components.twitter
        ])
      ]),
      div('.row.mb-xs', [
        div('.col-12.raw-line', [
          em('.mr-4', ['Facebook']),
          components.facebook
        ])
      ]),
      div('.row', [
        div('.col-12.raw-line', [
          em('.mr-4', ['Instagram']),
          components.instagram
        ])
      ])
    ])
  })

  const output$ = combineObj({
    email: email_component.output$,
    twitter: twitter_component.output$,
    facebook: facebook_component.output$,
    instagram: instagram_component.output$,
    website: website_component.output$
  }).debounceTime(0).map((components: any) => {
    const {email, twitter, facebook, instagram, website} = components
    return {
      errors: email.errors.concat(twitter.errors).concat(facebook.errors).concat(instagram.errors).concat(website.errors),
      valid: email.valid && twitter.valid && facebook.valid && instagram.valid && website.valid,
      data: {
        email: email.data,
        twitter: twitter.data,
        facebook: facebook.data,
        instagram: instagram.data,
        website: website.data
      }
    }
  })

  return {
    DOM: vtree$,
    output$
  }
}