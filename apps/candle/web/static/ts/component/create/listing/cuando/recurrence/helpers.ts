// import {RRule} from 'rrule'

// function dayToRRuleDay(day) {
//   switch (day) {
//     case 'monday':
//       return RRule.MO
//     case 'tuesday':
//       return RRule.TU
//     case 'wednesday':
//       return RRule.WE
//     case 'thursday':
//       return RRule.TH
//     case 'friday':
//       return RRule.FR
//     case 'saturday':
//       return RRule.SA
//     case 'sunday':
//       return RRule.SU
//     default:
//       throw new Error(`Invalid day`)
//   }
// }

// function freqToRRuleFreq(freq) {
//   switch (freq) {
//     case 'weekly':
//       return RRule.WEEKLY
//     case 'monthly':
//       return RRule.MONTHLY
//     case 'daily':
//       return RRule.DAILY
//     default:
//       throw new Error(`Invalid freq`)
//   }
// }

// export function getActualRRule(rrule) {
//   const options = {
//     ...rrule,
//     freq: freqToRRuleFreq(rrule.freq),
//     interval: rrule.interval || 1,
//     byweekday: rrule.byweekday.map(dayToRRuleDay),
//     dtstart: rrule.dtstart.toDate(),
//     until: rrule.until ? rrule.until.clone().endOf('day').toDate() : undefined
//   }
//   //console.log(`rrule options`, options)
//   return new RRule(options)
// }