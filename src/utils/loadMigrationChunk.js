import * as d3 from "d3"
import { stripMapName } from "./stripMapName.js"

export async function loadMigrationChunk(chunk) {
  const migrationChunk = await d3.csv(`/data/migration/${chunk}.csv`)

  const strippedChunk = migrationChunk.map(row => ({
    ...row,
    StartRegion: stripMapName(row.StartRegion),
    EndRegion: stripMapName(row.EndRegion)
  }))

  return strippedChunk
}
