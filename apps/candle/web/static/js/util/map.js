export function getCenterZoom(ev) {
  //console.log(`getting centerZoom...`)
  let map = ev.target
  //console.log(map.getCenter)
  const newCenter = map.getCenter()

  let centerZoom = {
    zoom: map.getZoom(),
    center: newCenter
  }

  return centerZoom
}
