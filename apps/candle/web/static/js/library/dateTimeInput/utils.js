import moment from 'moment'
export const AM = `A.M.`
export const PM = `P.M.`
export function getDateFromStateInfo(currentDate, currentTime) {
  if (currentDate && currentTime) {
    const {year, month, date} = currentDate
    const {hour, minute, mode} = currentTime
    return new Date(year, month, date, mode === `P.M.` ? (hour === 12 ? hour : hour + 12) : (hour === 12 ? 0 : hour), minute)
  }

  throw new Error(`Invalid currentDate or currentTime`)
}

export function getMomentFromStateInfo(currentDate, currentTime) {
  return moment(getDateFromStateInfo(currentDate, currentTime).toISOString())
}