export async function loadMapData(mapFile) {
  const response = await fetch(`/data/maps/${mapFile}`)
  const mapData = await response.json()
  return mapData
}