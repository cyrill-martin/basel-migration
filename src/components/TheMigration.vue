<script setup>
import * as d3 from "d3"
import { NFlex } from "naive-ui"
import { onMounted, ref, computed, watch } from "vue"
import { debounce } from "../utils/debounce.js"
import { useScreenSizeStore } from "../stores/screenSize.js"
import { loadMapData } from "../utils/loadMapData.js"
import { loadMigrationChunk } from "../utils/loadMigrationChunk.js"
import { getCentroids } from "../utils/getCentroids.js"
import { stripMapName } from "../utils/stripMapName.js"
import TheControls from "./TheControls.vue"

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
  await loadMigrationData("2006-6")
  isLoading.value = false

  console.log(migration.value)
  drawMigrationStart(migration.value, drawMigration)
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

  drawMigrationStart(migration.value, drawMigration)
}

// Load the maps //////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const mapAreaHeight = computed(() => screenSize.height * 0.8)

const baselMap = ref(null)
const switzerlandMap = ref(null)
const europeMap = ref(null)
const worldMap = ref(null)

const centroids = ref({
  basel: null,
  switzerland: null,
  europe: null,
  world: null
})

const worldMapTranslationFactor = 0.1

const mapTranslation = computed(() => {
  const basel = { x: 0, y: 0 }
  const switzerland = { x: 0, y: mapAreaHeight.value / 2 }
  const europe = { x: screenSize.width / 2, y: 0 }
  const additionalWorldMapYTranslation = (mapAreaHeight.value / 2) * worldMapTranslationFactor
  const world = {
    x: screenSize.width / 2,
    y: mapAreaHeight.value / 2 + additionalWorldMapYTranslation
  }
  return {
    basel,
    switzerland,
    europe,
    world
  }
})

async function loadMaps() {
  baselMap.value = await loadMapData("basel.geojson")
  switzerlandMap.value = await loadMapData("switzerland.geojson")
  europeMap.value = await loadMapData("europe.geojson")
  worldMap.value = await loadMapData("world.geojson")
}

// Load the migration data ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const migration = ref(null)

async function loadMigrationData(migrationChunk) {
  const dataChunk = await loadMigrationChunk(migrationChunk)

  migration.value = dataChunk
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

// Draw Basel
async function drawBasel() {
  const projection = d3
    .geoMercator()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], baselMap.value)

  const path = d3.geoPath().projection(projection)

  // Get Basel centroids
  centroids.value.basel = getCentroids(false, baselMap.value, path, "wov_name")

  baselCtr.value = ctr.value
    .append("g")
    .attr("id", "basel-ctr")
    .attr(
      "transform",
      `translate(${mapTranslation.value.basel.x}, ${mapTranslation.value.basel.y})`
    )

  baselCtr.value
    .selectAll("path")
    .data(baselMap.value.features)
    .enter()
    .append("path")
    .attr("class", (d) => `map-region basel-${stripMapName(d.properties.wov_name)}`)
    .attr("d", path)
    .style("fill", regionFill)
    .style("stroke", borderStroke)
    .style("stroke-width", "1px")
    .attr("cursor", "pointer")
}

// Draw Switzerland
async function drawSwitzerland() {
  const projection = d3
    .geoMercator()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], switzerlandMap.value)

  const path = d3.geoPath().projection(projection)

  // Get Switzerland centroids
  centroids.value.switzerland = getCentroids(true, switzerlandMap.value, path, "NAME")

  switzerlandCtr.value = ctr.value
    .append("g")
    .attr("id", "switzerland-ctr")
    .attr(
      "transform",
      `translate(${mapTranslation.value.switzerland.x}, ${mapTranslation.value.switzerland.y})`
    )

  switzerlandCtr.value
    .selectAll("path")
    .data(switzerlandMap.value.features)
    .enter()
    .append("path")
    .attr("class", (d) => `map-region switzerland-${stripMapName(d.properties.NAME)}`)
    .attr("d", path)
    .style("fill", (d) => {
      return d.properties.NAME === "Basel-Stadt" ? omittedRegionFill : regionFill
    })
    .style("stroke", borderStroke)
    .style("stroke-width", "1px")
    .attr("cursor", "pointer")
}

// Draw Europe
async function drawEurope() {
  const projection = d3
    .geoNaturalEarth1()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], europeMap.value)

  const path = d3.geoPath().projection(projection)

  // Get Europe centroids
  centroids.value.europe = getCentroids(false, europeMap.value, path, "name")

  europeCtr.value = ctr.value
    .append("g")
    .attr("id", "europe-ctr")
    .attr(
      "transform",
      `translate(${mapTranslation.value.europe.x}, ${mapTranslation.value.europe.y})`
    )

  europeCtr.value
    .selectAll("path")
    .data(europeMap.value.features)
    .enter()
    .append("path")
    .attr("class", (d) => `map-region europe-${stripMapName(d.properties.name)}`)
    .attr("d", path)
    .style("fill", (d) => {
      return d.properties.name === "Switzerland" ? omittedRegionFill : regionFill
    })
    .style("stroke", borderStroke)
    .style("stroke-width", "1px")
    .attr("cursor", "pointer")
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
  centroids.value.world = getCentroids(false, worldMap.value, path, "name")

  worldCtr.value = ctr.value
    .append("g")
    .attr("id", "world-ctr")
    .attr(
      "transform",
      `translate(${mapTranslation.value.world.x}, ${mapTranslation.value.world.y})`
    )

  worldCtr.value
    .selectAll("path")
    .data(worldMap.value.features)
    .enter()
    .append("path")
    .attr("class", (d) => `map-region world-${stripMapName(d.properties.name)}`)
    .attr("d", path)
    .style("fill", (d) => {
      return d.properties.continent === "Europe" && d.properties.name !== "Russia"
        ? omittedRegionFill
        : regionFill
    })
    .style("stroke", borderStroke)
    .style("stroke-width", "1px")
    .attr("cursor", "pointer")
}

// Draw and animate the migrations ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const regionFill = "darkslategray"
const omittedRegionFill = "lightgrey"
const borderStroke = "black"

const migrationColors = {
  emigrant: "#a61322",
  emigrantRegion: "#ffdddd",
  migrationRegion: "#ccedff",
  immigrant: "#269d5e",
  immigrantRegion: "#ddffdd"
}

const animationDurations = {
  setBackRegions: 1000,
  setRegionColor: 2500,
  migration: 2500
}

const unknownTranslation = computed(() => {
  const x = screenSize.width * 0.075
  const y = mapAreaHeight.value * 0.25
  return {
    x,
    y
  }
  // mapTranslation.value.europe * 0.1 - mapTranslation.value.basel
})

function xAccessor(d, type) {
  const map = type === "start" ? "StartKarte" : "EndKarte"
  const region = type === "start" ? "StartRegion" : "EndRegion"

  // console.log(d[map])
  // console.log(d[region])

  let xCoord

  if (d[map] !== "NA" && d[region] !== "NA") {
    xCoord = centroids.value[d[map]][d[region]][0] + mapTranslation.value[d[map]].x
  } else if (d[map] !== "NA" && d[region] === "NA") {
    xCoord = mapTranslation.value[d[map]].x + unknownTranslation.value.x
  } else {
    xCoord = mapTranslation.value.world.x + unknownTranslation.value.x
  }
  return xCoord + addJitter()
}

function yAccessor(d, type) {
  const map = type === "start" ? "StartKarte" : "EndKarte"
  const region = type === "start" ? "StartRegion" : "EndRegion"

  let yCoord

  if (d[map] !== "NA" && d[region] !== "NA") {
    yCoord = centroids.value[d[map]][d[region]][1] + mapTranslation.value[d[map]].y
  } else if (d[map] !== "NA" && d[region] === "NA") {
    yCoord = mapTranslation.value[d[map]].y + unknownTranslation.value.y
  } else {
    yCoord = mapTranslation.value.world.y + unknownTranslation.value.y
  }
  return yCoord + addJitter()
}

function addJitter() {
  const randomNr = Math.random()
  const sign = Math.random() < 0.5 ? -1 : 1
  const maxJitter = screenSize.width * 0.0075
  return maxJitter * randomNr * sign
}

function migrantColorAccessor(d) {
  return d.Wanderungstyp === "Wegzug" ? migrationColors.emigrant : migrationColors.immigrant
}

function resetMigration() {
  d3.selectAll(".migrant").remove()
  d3.selectAll(".map-region")
    .transition()
    .duration(animationDurations.setBackRegions)
    .style("fill", function () {
      const currentFill = d3.select(this).style("fill")
      return currentFill !== omittedRegionFill ? regionFill : omittedRegionFill
    })
}

function drawMigrationStart(data, callback) {
  resetMigration()

  ctr.value
    .selectAll(".migrant")
    .data(data)
    .join(
      (enter) => {
        return enter
          .append("circle")
          .attr("class", "migrant")
          .attr("data-from-map", (d) => d.StartKarte)
          .attr("data-from-region", (d) => `${d.StartKarte}-${d.StartRegion}`)
          .attr("data-to-region", (d) => `${d.EndKarte}-${d.EndRegion}`)
          .attr("cx", (d) => xAccessor(d, "start"))
          .attr("cy", (d) => yAccessor(d, "start"))
          .attr("r", 3)
          .attr("fill", (d) => migrantColorAccessor(d))
          .attr("opacity", 0.7)
          .on("end", callback())
      },
      (update) => update,
      (exit) => exit
    )
}

async function drawMigration() {
  await animateMigration("basel")
  await animateMigration("switzerland")
  await animateMigration("europe")
  await animateMigration("world")
  await animateMigration("NA")
}

function setRegionColors(d) {
  function setColor(region, isEmigrant) {
    if (region) {
      const regions = d3.selectAll(`.${region}`)
      regions
        .transition()
        .duration(animationDurations.setRegionColor)
        .style("fill", function () {
          const currCol = d3.select(this).style("fill")
          return currCol === regionFill
            ? isEmigrant
              ? migrationColors.emigrantRegion
              : migrationColors.immigrantRegion
            : migrationColors.migrationRegion
        })
    }
  }

  const startRegion = d.StartRegion !== "NA" ? `${d.StartKarte}-${d.StartRegion}` : null
  const endRegion = d.EndRegion !== "NA" ? `${d.EndKarte}-${d.EndRegion}` : null

  if (d.Wanderungstyp === "Wegzug") {
    setColor(startRegion, true)
    setColor(endRegion, true)
  } else {
    setColor(startRegion, false)
    setColor(endRegion, false)
  }
}

function animateMigration(map) {
  return new Promise((resolve) => {
    let migrants = d3.selectAll(`[data-from-map="${map}"]`)

    migrants
      .transition()
      .duration(animationDurations.migration)
      .on("start", (d) => setRegionColors(d))
      .attr("cx", (d) => xAccessor(d, "end"))
      .attr("cy", (d) => yAccessor(d, "end"))
      .on("end", resolve)
  })
}
</script>

<template>
  <n-flex vertical>
    <TheControls :is-loading="isLoading" />
    <div id="basel-migration"></div>
  </n-flex>
</template>
