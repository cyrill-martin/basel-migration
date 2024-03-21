import { stripMapName } from "./stripMapName.js"

export function getCentroids(isSwitzerland, mapData, pathGenerator, regionAccessor) {
  const centroids = {}

  mapData.features.forEach((feature) => {
    const ktTeil = feature.properties.KT_TEIL
    const centroid = pathGenerator.centroid(feature)
    const countryName = stripMapName(feature.properties[regionAccessor])

    if (!isSwitzerland || ktTeil === "0" || ktTeil === "1") {
      centroids[countryName] = centroid
    }
  })

  return centroids
}
