<script setup>
import * as d3 from "d3"
import { NFlex, NSpin } from "naive-ui"
import { onMounted, ref, computed, watch } from "vue"
import { debounce } from "../utils/debounce.js"
import { useScreenSizeStore } from "../stores/screenSize.js"
import { loadMapData } from "../utils/loadMapData.js"
// import { loadMigrationChunk } from "../utils/loadMigrationChunk.js"
import { getCentroids } from "../utils/getCentroids.js"
import { stripMapName } from "../utils/stripMapName.js"
import TheControls from "./TheControls.vue"

const screenSize = useScreenSizeStore()

// Handle data loading, map creation, and animation ///////////////////////
///////////////////////////////////////////////////////////////////////////

onMounted(() => {
  createMigrationViz()
})

async function createMigrationViz() {
  await loadMaps()
  await initiateSvg()
  drawMaps()
}

const migration = ref(null)
const animationSpeed = ref(null)

async function startAnimation(data, speed) {
  animationSpeed.value = speed

  await resetMigration()

  migration.value = data
  if (migration.value) {
    await drawInitialPositions()
    animateMigration()
  }
}

function stopAnimation() {
  resetMigration()
  animationOngoing.value = false
}

// Handle screen resizing
watch(
  () => screenSize.width,
  () => {
    debouncedRecreate()
  }
)

const debouncedRecreate = debounce(() => {
  recreateMigrationViz()
}, 200)

async function recreateMigrationViz() {
  d3.select("#svg-chart").remove()
  await initiateSvg()
  drawMaps()
  if (migration.value) {
    await drawInitialPositions()
    animateMigration()
  }
}

function resetMigration() {
  return new Promise((resolve) => {
    d3.selectAll(".migrant")
      .transition()
      .duration(animationDurations.resetMigration)
      .attr("opacity", 0)
      .remove()

    d3.selectAll(".map-region")
      .transition()
      .duration(animationDurations.resetMigration)
      .style("fill", function () {
        const currentFill = d3.select(this).style("fill")
        return currentFill !== omittedRegionFill ? regionFill : omittedRegionFill
      })
      .on("end", resolve)
  })
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
  const unknown = {
    x: screenSize.width * 0.075,
    y: mapAreaHeight.value * 0.25
  }
  return {
    basel,
    switzerland,
    europe,
    world,
    unknown
  }
})

async function loadMaps() {
  baselMap.value = await loadMapData("basel.geojson")
  switzerlandMap.value = await loadMapData("switzerland.geojson")
  europeMap.value = await loadMapData("europe.geojson")
  worldMap.value = await loadMapData("world.geojson")
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
const mapsDrawn = ref(false)
function drawMaps() {
  drawBasel()
  drawSwitzerland()
  drawEurope()
  drawWorld()
  mapsDrawn.value = true
}

// Draw Basel
function drawBasel() {
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
function drawSwitzerland() {
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
function drawEurope() {
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
function drawWorld() {
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
    .style("stroke-width", "0.5px")
    .attr("cursor", "pointer")
}

// Draw and animate the migrations ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

const regionFill = "#000000"
const omittedRegionFill = "#737373"
const borderStroke = "rgb(250, 250, 250, 1.0)"

// https://carto.com/carto-colors/
const colorPalettes = {
  tealRose: ["#009392", "#72aaa1", "#f1eac8", "#d98994", "#d0587e"],
  temps: ["#009392", "#39b185", "#e9e29c", "#e88471", "#cf597e"],
  fall: ["#3d5941", "#778868", "#f6edbd", "#de8a5a", "#ca562c"],
  geyser: ["#008080", "#70a494", "#f6edbd", "#de8a5a", "#ca562c"]
}

const colors = colorPalettes.tealRose

const migrationColors = {
  emigrant: colors[0],
  emigrantRegion: colors[1],
  migrationRegion: colors[2],
  immigrantRegion: colors[3],
  immigrant: colors[4]
}

const animationDurations = {
  resetMigration: 1000,
  setBackRegions: 500,
  setRegionColor: 2000,
  initialPosition: 750,
  migration: 1750
}

async function drawInitialPositions() {
  animationOngoing.value = true
  await drawMigrationStart(migration.value.get("basel"), "basel")
  await drawMigrationStart(migration.value.get("switzerland"), "switzerland")
  await drawMigrationStart(migration.value.get("europe"), "europe")
  const world = migration.value.get("world")
  const na = migration.value.get("NA")
  await drawMigrationStart(world.concat(na), "world")
}

function xAccessor(d, type) {
  const map = type === "start" ? "StartKarte" : "EndKarte"
  const region = type === "start" ? "StartRegion" : "EndRegion"

  // console.log(d[map])
  // console.log(d[region])

  let xCoord

  if (d[map] !== "NA" && d[region] !== "NA") {
    xCoord = centroids.value[d[map]][d[region]][0] + mapTranslation.value[d[map]].x
  } else if (d[map] !== "NA" && d[region] === "NA") {
    xCoord = mapTranslation.value[d[map]].x + mapTranslation.value.unknown.x
  } else {
    xCoord = mapTranslation.value.world.x + mapTranslation.value.unknown.x
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
    yCoord = mapTranslation.value[d[map]].y + mapTranslation.value.unknown.y
  } else {
    yCoord = mapTranslation.value.world.y + mapTranslation.value.unknown.y
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

function drawMigrationStart(data, map) {
  return new Promise((resolve) => {
    ctr.value
      .selectAll(`.migrant-${map}`)
      .data(data)
      .join(
        (enter) => {
          return enter
            .append("circle")
            .attr("class", () =>
              map === "world" ? `migrant migrant-${map} migrant-NA` : `migrant migrant-${map}`
            )
            .attr("data-from-map", (d) => d.StartKarte)
            .attr("data-to-map", (d) => d.EndKarte)
            .attr("cx", (d) => xAccessor(d, "start"))
            .attr("cy", (d) => yAccessor(d, "start"))
            .attr("r", 3)
            .attr("fill", (d) => migrantColorAccessor(d))
            .attr("opacity", 0.0)
        },
        (update) => update,
        (exit) => exit
      )
    const migrants = ctr.value.selectAll(`.migrant-${map}`)
    migrants
      .transition()
      .duration(animationDurations.initialPosition * animationSpeed.value)
      .attr("opacity", 0.7)
      .on("end", resolve)
  })
}

const animationOngoing = ref(false)

async function animateMigration() {
  // Basel <--> Switzerland
  await animateMigrants("data-to-map", "switzerland", false)
  await animateMigrants("data-from-map", "switzerland", false)
  // Basel <--> Europe
  await animateMigrants("data-to-map", "europe", false)
  await animateMigrants("data-from-map", "europe", false)
  // Basel <--> world
  await animateMigrants("data-to-map", "world", false)
  await animateMigrants("data-from-map", "world", true)
}

function setRegionColors(d) {
  function setColor(region, isEmigrant) {
    if (region) {
      const regions = d3.selectAll(`.${region}`)
      regions
        .transition()
        .duration(animationDurations.setRegionColor * animationSpeed.value)
        .style("fill", function () {
          const currCol = d3.color(d3.select(this).style("fill")).formatRgb()
          const regionFillRgb = d3.color(regionFill).formatRgb()

          return currCol === regionFillRgb
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

function animateMigrants(attr, map, last) {
  return new Promise((resolve) => {
    const migrants =
      map === "world"
        ? d3.selectAll(`[${attr}="${map}"] , [${attr}="NA"]`)
        : d3.selectAll(`[${attr}="${map}"]`)

    migrants
      .transition()
      .duration(animationDurations.migration * animationSpeed.value)
      .on("start", (d) => setRegionColors(d))
      .attr("cx", (d) => xAccessor(d, "end"))
      .attr("cy", (d) => yAccessor(d, "end"))
      .on("end", () => {
        if (last) {
          animationOngoing.value = false
        }
        resolve()
      })
  })
}
</script>

<template>
  <n-flex vertical style="flex: 1">
    <TheControls :animation-ongoing="animationOngoing" @start-animation="startAnimation" @stop-animation="stopAnimation" />
    <div id="basel-migration">
      <n-flex v-if="!mapsDrawn" justify="center">
        <n-spin />
      </n-flex>
    </div>
  </n-flex>
</template>

<style scoped>
/* #basel-migration {
  background-color: rgba(209, 47, 136, 0.39);
} */
</style>
