import moment = require('moment')

function inflateCuandoDates(container) {
  const {rrule, rdate, exdate} = container

  if (rrule && rrule.dtstart) {
    container.rrule.dtstart = moment(rrule.dtstart)
  }

  if (rdate.length) {
    container.rdate = container.rdate.map(x => moment(x))
  }

  if (exdate.length) {
    container.exdate = container.exdate.map(x => moment(x))
  }
}

function deflateCuandoDates(container) {
  const {rrule, rdate, exdate} = container

  if (rrule && rrule.dtstart) {
    container.rrule.dtstart = rrule.dtstart.toDate().toISOString()
  }

  if (rdate && rdate.length) {
    container.rdate = container.rdate.map(x => x.toDate().toISOString())
  }

  if (exdate && exdate.length) {
    container.exdate = container.exdate.map(x => x.toDate().toISOString())
  }
}

export function inflateDates(session) {
  //console.log(`inflateDates`, session)
  const {properties, listing} = session
  const {type} = listing


  if (type === `recurring`) {
    if (session.listing.cuando) { inflateCuandoDates(session.listing.cuando) }
    if (session.properties.recurrence) { inflateCuandoDates(session.properties.recurrence) }
  } else {
    if (session.listing.cuando) {
      const {begins, ends} = listing.cuando
      if (begins) { session.listing.cuando.begins = moment(begins) }
      if (ends) { session.listing.cuando.ends = moment(ends) }
    }
  }

  return session
}

export function deflateDates(session) {
  const {properties, listing} = session
  const {type} = listing

  if (type === `recurring`) {
    if (listing.cuando) { deflateCuandoDates(session.listing.cuando) }
    if (properties.recurrence) { deflateCuandoDates(session.properties.recurrence) }
  } else {
    if (listing.cuando) {
      const {begins, ends} = listing.cuando
      if (begins) { session.listing.cuando.begins = begins.toDate().toISOString() }
      if (ends) { session.listing.cuando.ends = ends.toDate().toISOString() }
    }
  }

  return session
}

export function getSessionStream(sources) {
  return sources.Router.history$
    .map(x => x.state.data)
    .map(inflateDates)
}

export function fromCheckbox(ev) {
  const checked = ev.target.checked
  return {
    value: ev.target.value,
    checked
  }
}