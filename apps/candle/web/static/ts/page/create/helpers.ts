import {div, h5} from '@cycle/dom'
import {isOptional} from './listing'
import moment = require('moment')

export const standardize = m => m.date(1).month(0).year(2010).seconds(0).milliseconds(0)
export function getTimeFromCurrentTime(currentTime) {
  if (currentTime) {
    const {hour, minute, mode} = currentTime
    // only used for distinct until changed comparison so hard code day/month/year
    return new Date(2010, 0, 1, mode === `P.M.` ? (hour === 12 ? hour : hour + 12) : (hour === 12 ? 0 : hour), minute, 0, 0)
  }

  throw new Error(`Invalid currentTime`)
}

export function getMomentFromCurrentTime(currentTime) {
  return standardize(moment(getTimeFromCurrentTime(currentTime).toISOString()))
}

export function getDateFromCurrentDate(currentDate) {
  if (currentDate) {
    const {year, month, date} = currentDate
    return new Date(year, month, date)
  }

  throw new Error(`Invalid currentDate`)
}

export function getMomentFromCurrentDate(currentDate) {
  return moment(getDateFromCurrentDate(currentDate).toISOString())
}

export function renderHeading(val, section, property, listing) {
  const optional = section ? isOptional(section, property, listing) : false
  return div(`.panel-title`, [
    h5([`${val}${optional ? ' (optional)': ''}`])
  ])
}

export function renderBasic(content, image) {
  return div(`.content-body`, [
    div(`.left-side`, [
      content
    ]),
    div(`.right-side`, [
      image
    ])
  ])
}

// export function renderWithInstruction(content, instruction) {
//   return div(`.content-body`, [
//     div(`.left-side`, [
//       content,
//       components.instruction ? (!state.showInstruction ? div(`.appOpenInstruction.instruction-section.hide`, [
//         span(`.icon.fa.fa-lightbulb-o`)
//       ]) :
//       div(`.instruction-section.show`, [
//         span(`.appCloseInstruction.close-icon`),
//         span(`.icon.fa.fa-lightbulb-o`),
//         components.instruction
//       ])) : null
//     ]),
//     div(`.right-side`, [
//       instruction
//     ])
//   ])
// }