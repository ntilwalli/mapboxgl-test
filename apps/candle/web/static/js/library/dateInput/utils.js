export function getCurrentDate(currentDate, currentTime) {
  if (currentDate && currentTime) {
    const {year, month, date} = currentDate
    const {hour, minute, mode} = currentTime
    return new Date(year, month, date, mode === `P.M.` ? (hour === 12 ? hour : hour + 12) : (hour === 12 ? 0 : hour), minute)
  }

  throw new Error(`Invalid currentDate or currentTime`)
}