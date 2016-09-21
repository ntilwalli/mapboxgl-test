import moment from 'moment'
export const AM = `A.M.`
export const PM = `P.M.`
export function getDateFromStateInfo(currentDate) {
  if (currentDate) {
    const {year, month, date} = currentDate
    return new Date(year, month, date)
  }

  throw new Error(`Invalid currentDate or currentTime`)
}

export function getMomentFromStateInfo(currentDate) {
  return moment(getDateFromStateInfo(currentDate).toISOString())
}