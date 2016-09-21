import moment from 'moment'
export const AM = `A.M.`
export const PM = `P.M.`
export const standardize = m => m.date(1).month(0).year(2010).seconds(0).milliseconds(0)
export function getTimeFromStateInfo(currentTime) {
  if (currentTime) {
    const {hour, minute, mode} = currentTime
    // only used for distinct until changed comparison so hard code day/month/year
    return new Date(2010, 0, 1, mode === `P.M.` ? (hour === 12 ? hour : hour + 12) : (hour === 12 ? 0 : hour), minute, 0, 0)
  }

  throw new Error(`Invalid currentDate or currentTime`)
}

export function getMomentFromStateInfo(currentDate, currentTime) {
  return standardize(moment(getTimeFromStateInfo(currentDate, currentTime).toISOString()))
}