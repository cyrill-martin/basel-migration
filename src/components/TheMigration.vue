<script setup>
import * as d3 from "d3"
import { NFlex, NSpin } from "naive-ui"
import { onMounted, ref, computed, watch } from "vue"
import { debounce } from "../utils/debounce.js"
import { useScreenSizeStore } from "../stores/screenSize.js"

const screenSize = useScreenSizeStore()

// Handle data loading, map creation, and animation ///////////////////////
///////////////////////////////////////////////////////////////////////////
const isLoading = ref(true)

onMounted(() => {
  createMigration()
})

async function createMigration() {
  await loadMaps()
  await initiateSvg()
  await drawMaps()
  await loadMigrationData()
  isLoading.value = false

  console.log(migration.value)
}

// Handle screen resizing
watch(
  () => screenSize.width,
  () => {
    debouncedRecreate()
  }
)

const debouncedRecreate = debounce(() => {
  recreateMigration()
}, 500)

async function recreateMigration() {
  d3.select("#svg-chart").remove()
  isLoading.value = true
  await initiateSvg()
  await drawMaps()
  isLoading.value = false
}

// Load the maps //////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const mapAreaHeight = computed(() => screenSize.height * 0.8)

const baselMap = ref(null)
const baselMapTranslation = ref({ x: 0, y: 0 })
const baselCentroids = ref(null)

const switzerlandMap = ref(null)
const switzerlandMapTranslation = computed(() => ({ x: 0, y: mapAreaHeight.value / 2 }))
const switzerlandCentroids = ref(null)

const europeMap = ref(null)
const europeMapTranslation = computed(() => ({ x: screenSize.width / 2, y: 0 }))
const europeCentroids = ref(null)

const worldMap = ref(null)
const worldMapTranslationFactor = 0.1
const additionalWorldMapYTranslation = computed(
  () => (mapAreaHeight.value / 2) * worldMapTranslationFactor
)
const worldMapTranslation = computed(() => ({
  x: screenSize.width / 2,
  y: mapAreaHeight.value / 2 + additionalWorldMapYTranslation.value
}))
const worldCentroids = ref(null)

async function loadMaps() {
  baselMap.value = await loadMapData("basel.geojson")
  switzerlandMap.value = await loadMapData("switzerland.geojson")
  europeMap.value = await loadMapData("europe.geojson")
  worldMap.value = await loadMapData("world.geojson")
}

async function loadMapData(mapFile) {
  const response = await fetch(`/data/maps/${mapFile}`)
  const mapData = await response.json()
  return mapData
}

// Load the migration data ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const migration = ref(null)

async function loadMigrationData() {
  const chunk = await loadMigrationChunk("2022-5")
  migration.value = chunk
}

async function loadMigrationChunk(chunk) {
  const migrationChunk = await d3.csv(`/data/migration/${chunk}.csv`)
  return migrationChunk
}

// Create the SVG /////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const svg = ref(null)
const ctr = ref(null)

const baselCtr = ref(null)
const switzerlandCtr = ref(null)
const europeCtr = ref(null)
const worldCtr = ref(null)

async function initiateSvg() {
  svg.value = d3
    .select("#basel-migration")
    .append("svg")
    .attr("id", "svg-chart")
    .attr("viewBox", `0 0 ${screenSize.width} ${mapAreaHeight.value}`)

  ctr.value = await svg.value
    .append("g")
    .attr("id", "chart-ctr")
    .attr("transform", `translate(0, 0)`)
}

// Draw the maps and get the centroids ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
async function drawMaps() {
  await drawBasel()
  await drawSwitzerland()
  await drawEurope()
  await drawWorld()
}

function getCentroids(mapData, pathGenerator, regionAccessor) {
  const centroids = {}
  mapData.features.forEach((feature) => {
    const centroid = pathGenerator.centroid(feature)
    const countryName = feature.properties[regionAccessor]
    centroids[countryName] = centroid
  })
  return centroids
}

// Draw Basel
async function drawBasel() {
  const projection = d3
    .geoMercator()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], baselMap.value)

  const path = d3.geoPath().projection(projection)

  // Get Basel centroids
  baselCentroids.value = getCentroids(baselMap.value, path, "wov_name")

  baselCtr.value = ctr.value
    .append("g")
    .attr("id", "basel-ctr")
    .attr("transform", `translate(${baselMapTranslation.value.x}, ${baselMapTranslation.value.y})`)

  baselCtr.value
    .selectAll("path")
    .data(baselMap.value.features)
    .enter()
    .append("path")
    .attr("id", (d) => d.properties.wov_name)
    .attr("d", path)
    .style("fill", "black")
    .style("stroke", "white")
    .style("stroke-width", "1px")
}

// Draw Switzerland
async function drawSwitzerland() {
  const projection = d3
    .geoMercator()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], switzerlandMap.value)

  const path = d3.geoPath().projection(projection)

  // Get Switzerland centroids
  switzerlandCentroids.value = getCentroids(switzerlandMap.value, path, "NAME")

  switzerlandCtr.value = ctr.value
    .append("g")
    .attr("id", "switzerland-ctr")
    .attr(
      "transform",
      `translate(${switzerlandMapTranslation.value.x}, ${switzerlandMapTranslation.value.y})`
    )

  switzerlandCtr.value
    .selectAll("path")
    .data(switzerlandMap.value.features)
    .enter()
    .append("path")
    .attr("id", (d) => d.properties.NAME)
    .attr("d", path)
    .style("fill", (d) => {
      return d.properties.NAME === "Basel-Stadt" ? "lightgrey" : "black"
    })
    .style("stroke", "white")
    .style("stroke-width", "1px")
}

// Draw Europe
async function drawEurope() {
  const projection = d3
    .geoNaturalEarth1()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], europeMap.value)

  const path = d3.geoPath().projection(projection)

  // Get Europe centroids
  europeCentroids.value = getCentroids(europeMap.value, path, "name")

  europeCtr.value = ctr.value
    .append("g")
    .attr("id", "europe-ctr")
    .attr(
      "transform",
      `translate(${europeMapTranslation.value.x}, ${europeMapTranslation.value.y})`
    )

  europeCtr.value
    .selectAll("path")
    .data(europeMap.value.features)
    .enter()
    .append("path")
    .attr("class", (d) => `eur-${d.properties.name}`)
    .attr("d", path)
    .style("fill", (d) => {
      return d.properties.name === "Switzerland" ? "lightgrey" : "black"
    })
    .style("stroke", "white")
    .style("stroke-width", "0.5px")
}

// Draw the world
async function drawWorld() {
  const projection = d3
    // .geoMercator()
    .geoNaturalEarth1()
    .fitSize(
      [screenSize.width / 2, (mapAreaHeight.value / 2) * (1 - worldMapTranslationFactor)],
      worldMap.value
    )

  const path = d3.geoPath().projection(projection)

  // Get world centroids
  worldCentroids.value = getCentroids(worldMap.value, path, "name")

  worldCtr.value = ctr.value
    .append("g")
    .attr("id", "world-ctr")
    .attr("transform", `translate(${worldMapTranslation.value.x}, ${worldMapTranslation.value.y})`)

  worldCtr.value
    .selectAll("path")
    .data(worldMap.value.features)
    .enter()
    .append("path")
    .attr("class", (d) => `wld-${d.properties.name}`)
    .attr("d", path)
    .style("fill", (d) => {
      return d.properties.continent === "Europe" && d.properties.name !== "Russia"
        ? "lightgrey"
        : "black"
    })
    .style("stroke", "white")
    .style("stroke-width", "0.5px")
}

// Draw and animate the migrations ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////


</script>

<template>
  <n-flex vertical>
    <div v-if="isLoading" style="text-align: center">
      <p>Daten werden geladen...</p>
      <p><n-spin size="medium" /></p>
    </div>
    <div id="basel-migration"></div>
  </n-flex>
</template>

<style scoped></style>
