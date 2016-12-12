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

  const email_component = EmailInputComponent(sources, shared$.pluck('email'), component_id + ': Invalid e-mail', email_props)

  const twitter_props = {
    placeholder: `Twitter handle`,
    name: `twitter-input`,
    styleClass: `.text-input`,
    emptyIsError: false
  }

  const twitter_component = TwitterInputComponent(sources, shared$.pluck('twitter'), component_id + ': Invalid Twitter', twitter_props)

  const facebook_props = {
    placeholder: `Facebook page`,
    name: `facebook-input`,
    styleClass: `.url-input`,
    emptyIsError: false
  }

  const facebook_component = URLInputComponent(sources, shared$.pluck('facebook'), component_id + ': Invalid Facebook', facebook_props)

  const instagram_props = {
    placeholder: `Instagram handle`,
    name: `facebook-input`,
    styleClass: `.text-input`,
    emptyIsError: false
  }

  const instagram_component = isolate(TextInputComponent)(sources, shared$.pluck('instagram'), component_id + ': Invalid Instagram', instagram_props)

  const website_props = {
    placeholder: `Website`,
    name: `website-input`,
    styleClass: `.url-input`,
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
      ]),
      div('.row', [
        div('.sub-sub-heading.item.flex.align-center', ['Website']),
        components.website
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