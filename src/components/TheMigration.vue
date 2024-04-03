<script setup>
import * as d3 from "d3"
import { NFlex, NSpin } from "naive-ui"
import { onMounted, ref, computed, watch } from "vue"
import { debounce } from "../utils/debounce.js"
import { useScreenSizeStore } from "../stores/screenSize.js"
import { loadMapData } from "../utils/loadMapData.js"
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

const selectedDate = ref(null)
const migration = ref(null)
const animationSpeed = ref(null)

async function startAnimation(obj) {
  animationSpeed.value = obj.speed
  selectedDate.value = `${obj.date.month} ${obj.date.year}`

  await resetMigration()

  migration.value = obj.data
  if (migration.value) {
    await drawInitialPositions()
    animateMigration()
  }
}

async function stopAnimation() {
  await resetMigration()
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
    // Remove legend
    d3.select("#map-legend").remove()

    // Remove migrants
    d3.selectAll(".migrant")
      .transition()
      .duration(animationDurations.resetMigration)
      .attr("opacity", 0)
      .remove()

    // Remove migration paths
    toggleMigrationPaths(false, true)
    migrationPaths.value = false

    // Set back region colors
    d3.selectAll(".map-region")
      .transition()
      .duration(animationDurations.resetMigration)
      .style("fill", function () {
        const currentFill = d3.color(d3.select(this).style("fill")).formatRgb()
        const myOmittedRegionFill = d3.color(omittedRegionFill).formatRgb()
        return currentFill !== myOmittedRegionFill ? regionFill : omittedRegionFill
      })
      .on("end", resolve)
  })
}

// Load the maps //////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const mapAreaHeight = computed(() =>
  screenSize.isMobile ? screenSize.height * 0.6 : screenSize.height * 0.8
)

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
const migrationsCtr = ref(null)

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
  addMapMouseEvents()
}

function addMapMouseEvents() {
  addRegionMouseEvents("basel")
  addRegionMouseEvents("switzerland")
  addRegionMouseEvents("europe")
  addRegionMouseEvents("world")
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
    .attr("class", (d) => `map-region basel-region basel-${stripMapName(d.properties.wov_name)}`)
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
    .attr(
      "class",
      (d) => `map-region switzerland-region switzerland-${stripMapName(d.properties.NAME)}`
    )
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
    .attr("class", (d) => `map-region europe-region europe-${stripMapName(d.properties.name)}`)
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
    .attr("class", (d) => `map-region world-region world-${stripMapName(d.properties.name)}`)
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
const migrantRadius = 3

const regionFill = "rgb(0, 0, 0)"
const omittedRegionFill = "rgb(115, 115, 115)"
const borderStroke = "rgb(250, 250, 250, 1.0)"

// https://carto.com/carto-colors/
const colors = [
  "rgb(208, 88, 126)", // Emigrant
  "rgb(217, 137, 148)", // Emigrant region
  "rgb(241, 234, 200)", // Migration region
  "rgb(114, 170, 161)", // Immigrant region
  "rgb(0, 147, 146)" // Imigrant
]

const migrationColors = {
  emigrant: colors[0],
  emigrantRegion: colors[1],
  migrationRegion: colors[2],
  immigrantRegion: colors[3],
  immigrant: colors[4],
  raisedEmigrantRegion: "rgb(247, 64, 89)",
  raisedImmigrantRegion: "rgb(41, 230, 199)"
}

const migrantOpacity = 0.7

// langsam: 1, mittel: 3, schnell: 5
const animationDurations = {
  resetMigration: 250,
  setRegionColor: 3900,
  initialPosition: 2400,
  migration: 4500
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
            .attr("data-from-region", (d) => d.StartRegion)
            .attr("data-to-map", (d) => d.EndKarte)
            .attr("data-to-region", (d) => d.EndRegion)
            .attr("cx", (d) => xAccessor(d, "start"))
            .attr("cy", (d) => yAccessor(d, "start"))
            .attr("r", migrantRadius)
            .attr("fill", (d) => migrantColorAccessor(d))
            .attr("stroke", (d) => migrantColorAccessor(d))
            .attr("stroke-width", "1px")
            .attr("opacity", 0.0)
        },
        (update) => update,
        (exit) => exit
      )
    const migrants = ctr.value.selectAll(`.migrant-${map}`)
    migrants
      .transition()
      .duration(animationDurations.initialPosition / animationSpeed.value)
      .attr("opacity", migrantOpacity)
      .on("end", resolve)
  })
}

const animationOngoing = ref(false)

async function animateMigration() {
  migrationsCtr.value = await ctr.value
    .append("g")
    .attr("id", "migrations-ctr")
    .attr("transform", `translate(0, 0)`)

  // Basel <--> Switzerland
  await animateMigrants("data-to-map", "switzerland", false)
  await animateMigrants("data-from-map", "switzerland", false)
  // Basel <--> Europe
  await animateMigrants("data-to-map", "europe", false)
  await animateMigrants("data-from-map", "europe", false)
  // Basel <--> world
  await animateMigrants("data-to-map", "world", false)
  await animateMigrants("data-from-map", "world", true)

  createLegend()
  addMigrantMouseEvents()
  toggleMigrationPaths(false)
}

function setRegionColor(d) {
  function setColor(region, isEmigrant) {
    if (region) {
      const regions = d3.selectAll(`.${region}`)
      let regionFillColor
      regions
        .transition()
        .duration(animationDurations.setRegionColor / animationSpeed.value)
        .style("fill", function () {
          const currCol = d3.select(this).style("fill")
          let fillColor
          if (currCol === regionFill) {
            // currCol is black
            fillColor = isEmigrant
              ? migrationColors.emigrantRegion
              : migrationColors.immigrantRegion
          } else if (currCol === migrationColors.emigrantRegion) {
            // currCol is red
            fillColor = isEmigrant
              ? migrationColors.emigrantRegion
              : migrationColors.migrationRegion
          } else if (currCol === migrationColors.immigrantRegion) {
            // currCol is green
            fillColor = isEmigrant
              ? migrationColors.migrationRegion
              : migrationColors.immigrantRegion
          } else {
            // currCol is yellow
            fillColor = migrationColors.migrationRegion
          }
          // Update region with final color (used later for migrant mouse events)
          regionFillColor = fillColor
          return fillColor
        })
        .attr("data-fill", regionFillColor)
    }
  }

  const startRegion = d.StartRegion !== "NA" ? `${d.StartKarte}-${d.StartRegion}` : null
  const endRegion = d.EndRegion !== "NA" ? `${d.EndKarte}-${d.EndRegion}` : null

  setColor(startRegion, d.Wanderungstyp === "Wegzug")
  setColor(endRegion, d.Wanderungstyp === "Wegzug")
}

async function animateMigrants(direction, map, last) {
  let migrants =
    map === "world"
      ? d3.selectAll(`[${direction}="${map}"] , [${direction}="NA"]`)
      : d3.selectAll(`[${direction}="${map}"]`)

  let migrantSelections = []

  if (migrants.size() > 800) {
    const numberOfParts = Math.floor(migrants.size() / 300)

    const maxSize = Math.ceil(migrants.size() / numberOfParts)

    for (let i = 0; i < numberOfParts; i++) {
      const startIndex = i * maxSize
      const endIndex = Math.min(startIndex + maxSize, migrants.size())

      let part = migrants.filter((_, index) => index >= startIndex && index < endIndex)
      migrantSelections.push(part)
    }
  } else {
    migrantSelections = [migrants]
  }

  for (const selection of migrantSelections) {
    await new Promise((resolve) => {
      selection
        .transition()
        .duration(animationDurations.migration / animationSpeed.value)
        .on("start", (d) => {
          setRegionColor(d)
          migrationsCtr.value
            .append("path")
            .datum(d)
            .attr("class", "migration-path")
            .attr("fill", "none")
            .attr("stroke", (d) => migrantColorAccessor(d))
            .attr("stroke-width", "1px")
            .attr("opacity", (d) => (d.Wanderungstyp === "Wegzug" ? 0.1 : 0.05))
            .attr(
              "d",
              (d) =>
                `M${xAccessor(d, "start")},${yAccessor(d, "start")}L${xAccessor(d, "start")},${yAccessor(d, "start")}`
            )
            .transition()
            .duration(animationDurations.migration / animationSpeed.value)
            .attr(
              "d",
              (d) =>
                `M${xAccessor(d, "start")},${yAccessor(d, "start")}L${xAccessor(d, "end")},${yAccessor(d, "end")}`
            )
        })
        .attr("cx", (d) => xAccessor(d, "end"))
        .attr("cy", (d) => yAccessor(d, "end"))
        .attr("cursor", "pointer")
        .on("end", resolve)
    })
  }

  if (last) {
    animationOngoing.value = false
  }
}

const migrationPaths = ref(null)

function togglePaths(value) {
  // Emitted from TheControls
  toggleMigrationPaths(value)
}

function removeMigrationPaths() {
  // Remove paths
  d3.selectAll(".migration-path")
    .transition()
    .duration(animationDurations.resetMigration)
    .attr("opacity", 0)
    .remove()
}

function toggleMigrationPaths(showPaths, reset = false) {
  if (!showPaths) {
    if (!reset) {
      // Clone and store paths in ref
      migrationPaths.value = d3
        .selectAll(".migration-path")
        .nodes()
        .map((node) => node.cloneNode(true))
      // Remove paths
      removeMigrationPaths()
    } else {
      migrationPaths.value = null
      // Remove paths
      removeMigrationPaths()
    }
  } else {
    // Append cloned paths
    migrationPaths.value.forEach((path) => {
      migrationsCtr.value.node().appendChild(path)
    })
  }
}

function createLegend() {
  const legendItems = {
    circles: [
      {
        color: migrationColors.immigrant,
        label: "Basler Zuzüger:in"
      },
      {
        color: migrationColors.emigrant,
        label: "Basler Wegzüger:in"
      }
    ],
    rectangles: [
      {
        color: migrationColors.immigrantRegion,
        label: "Nur Basler Zuzüger:innen"
      },
      {
        color: migrationColors.emigrantRegion,
        label: "Nur Basler Wegzüger:innen"
      },
      {
        color: migrationColors.migrationRegion,
        label: "Basler Zu- und Wegzüger:innen"
      },
      {
        color: regionFill,
        label: "Keine Basler Migration"
      }
    ]
  }

  const spacingVertical = 16
  const legendFontSize = "11px"

  const legendContainer = ctr.value.append("g").attr("id", "map-legend")

  const legendTitleGroup = legendContainer.append("g")

  legendTitleGroup
    .append("text")
    .attr("x", 0)
    .attr("y", 0)
    .text(`${selectedDate.value}`)
    .attr("font-size", legendFontSize)
    .attr("font-weight", "bold")

  legendTitleGroup
    .append("text")
    .attr("x", 0)
    .attr("y", spacingVertical)
    .text("Zu- und Wegzüge")
    .attr("font-size", legendFontSize)

  legendTitleGroup
    .append("text")
    .attr("x", 0)
    .attr("y", spacingVertical * 2)
    .text("Basel-Stadt")
    .attr("font-size", legendFontSize)

  const legendItemsGroup = legendContainer
    .append("g")
    .attr("transform", `translate(0,${spacingVertical * 4})`)

  const legendCircleItemsGroup = legendItemsGroup.append("g").attr("transform", `translate(0,0)`)

  const legendCircleItems = legendCircleItemsGroup
    .selectAll(".legend-circle-item")
    .data(legendItems.circles)
    .join("g")
    .attr("class", "legend-circle-item")
    .attr("transform", (_, i) => `translate(0,${spacingVertical * i})`)

  legendCircleItems
    .append("circle")
    .attr("cx", migrantRadius * 2.5)
    .attr("cy", 0)
    .attr("r", migrantRadius * 1.5)
    .attr("stroke", (d) => d.color)
    .attr("fill", (d) => d.color)
    .attr("opacity", migrantOpacity)
    .attr("dominant-baseline", "middle")

  legendCircleItems
    .append("text")
    .attr("x", migrantRadius * 8)
    .attr("y", 0)
    .text((d) => d.label)
    .attr("font-size", legendFontSize)
    .attr("dominant-baseline", "middle")

  const legendRectItemsGroup = legendItemsGroup
    .append("g")
    .attr("transform", `translate(0,${spacingVertical * 2})`)

  const legendRectItems = legendRectItemsGroup
    .selectAll(".legend-rect-item")
    .data(legendItems.rectangles)
    .join("g")
    .attr("class", "legend-rect-item")
    .attr("transform", (_, i) => `translate(0,${spacingVertical * i})`)

  legendRectItems
    .append("rect")
    .attr("x", 0)
    .attr("y", -spacingVertical * 0.5)
    .attr("width", migrantRadius * 5)
    .attr("height", spacingVertical * 0.7)
    .attr("fill", (d) => d.color)
    .attr("dominant-baseline", "middle")

  legendRectItems
    .append("text")
    .attr("x", migrantRadius * 8)
    .attr("y", 0)
    .text((d) => d.label)
    .attr("font-size", legendFontSize)
    .attr("dominant-baseline", "middle")

  const legendTranslationX =
    screenSize.width <= screenSize.height
      ? centroids.value.basel.Riehen[0] -
        (centroids.value.basel.Riehen[0] - centroids.value.basel.Hirzbrunnen[0]) * 0.5
      : centroids.value.basel.Bettingen[0] +
        (centroids.value.basel.Bettingen[0] - centroids.value.basel.Riehen[0])
  const legendTranslationY =
    screenSize.width <= screenSize.height
      ? centroids.value.basel.Breite[1]
      : centroids.value.basel.StJohann[1]

  legendContainer.attr("transform", `translate(${legendTranslationX},${legendTranslationY})`)
}

function getGeoJsonNameSelectorDOM(map) {
  // How to selected the region name as given in the DOM
  return map === "basel" ? "wov_name" : map === "switzerland" ? "NAME" : "name"
}

function getGeoJsonNameSelectorUX(map) {
  // How to selected the region name as presented to the user
  return map === "basel" ? "wov_name" : map === "switzerland" ? "NAME" : "name_de"
}

function getRegionNameDOM(regionData, selector) {
  return stripMapName(regionData["properties"][selector])
}

function getRegionNameUX(regionData, selector) {
  return regionData["properties"][selector]
}

function getHtmlContainerRect() {
  const htmlContainer = document.getElementById("basel-migration")
  return htmlContainer.getBoundingClientRect()
}

const htmlContainerRect = computed(() => {
  return getHtmlContainerRect()
})

function addRegionMouseEvents(map) {
  const regionSelection = d3.selectAll(`.${map}-region`)

  regionSelection.on("mouseover mouseout", function (event) {
    const regionData = d3.select(this).datum()

    const nameSelectorDOM = getGeoJsonNameSelectorDOM(map)
    const nameSelectorUX = getGeoJsonNameSelectorUX(map)

    const regionNameDOM = getRegionNameDOM(regionData, nameSelectorDOM)
    const regionNameUX = getRegionNameUX(regionData, nameSelectorUX)

    const isEmigrant = map === "basel"

    // Offsets to hit the centroids
    const xOffset = map === "basel" || map === "switzerland" ? -16 : -32
    let yOffset = map === "basel" || map === "europe" ? -16 : -32

    // Offset to place the tooltips top right of the centroids
    yOffset = -60

    // Raise emigrants or immigrants when hovering regions
    if (migration.value && !animationOngoing.value) {
      const migrantSelection = d3.selectAll(`[data-from-region=${regionNameDOM}]`)
      migrantSelection
        .attr(
          "stroke",
          event.type === "mouseover"
            ? regionFill
            : isEmigrant
              ? migrationColors.emigrant
              : migrationColors.immigrant
        )
        .attr("stroke-width", event.type === "mouseover" ? "2px" : "1px")
        .attr("r", event.type === "mouseover" ? migrantRadius * 2 : migrantRadius)
        .attr("opacity", event.type === "mouseover" ? 1 : migrantOpacity)
        .raise()
    }

    // Show/hide region tooltip
    d3.select("#region-tooltip")
      .text(regionNameUX)
      .style("display", event.type === "mouseover" ? "block" : "none")
      .style(
        "left",
        `${htmlContainerRect.value.x + (mapTranslation.value[map].x + centroids.value[map][regionNameDOM][0]) + xOffset}px`
      )
      .style(
        "top",
        `${htmlContainerRect.value.y + (mapTranslation.value[map].y + centroids.value[map][regionNameDOM][1]) + yOffset}px`
      )
  })
}

function addMigrantMouseEvents() {
  const migrantSelection = d3.selectAll(".migrant")

  migrantSelection.on("mouseover mouseout", function (event) {
    const migrant = d3.select(this)
    const migrantData = migrant.datum()

    const isEmigrant = migrantData.Wanderungstyp === "Wegzug"

    let originRegion = isEmigrant ? migrantData.VonWohnviertel : migrantData.StartRegion
    originRegion = stripMapName(originRegion)

    const startRegionElement =
      originRegion !== "NA" ? d3.selectAll(`.${migrantData.StartKarte}-${originRegion}`) : false

    const loweredRegionColor = startRegionElement
      ? startRegionElement.node().getAttribute("data-fill")
      : false
    const raisedRegionColor = isEmigrant
      ? migrationColors.raisedEmigrantRegion
      : migrationColors.raisedImmigrantRegion

    // Raise/lower origin region
    if (startRegionElement) {
      startRegionElement
        .style("fill", event.type === "mouseover" ? raisedRegionColor : loweredRegionColor)
        .style("stroke", event.type === "mouseover" ? raisedRegionColor : borderStroke)
        .style(
          "stroke-width",
          event.type === "mouseover" ? "4px" : migrantData.StartKarte === "world" ? "0.5px" : "1px"
        )

      if (event.type === "mouseover") {
        startRegionElement.raise()
      } else {
        startRegionElement.order()
      }
    }

    // Raise migrant
    migrant
      .attr(
        "stroke",
        event.type === "mouseover"
          ? regionFill
          : isEmigrant
            ? migrationColors.emigrant
            : migrationColors.immigrant
      )
      .attr("stroke-width", event.type === "mouseover" ? "2px" : "1px")
      .attr("r", event.type === "mouseover" ? migrantRadius * 2 : migrantRadius)
      .attr("opacity", event.type === "mouseover" ? 1 : migrantOpacity)
      .raise()

    // Show/hide migrant tooltip
    const migrantTooltip = d3.select("#migrant-tooltip")

    const startNameSelectorUX =
      migrantData.StartRegion !== "NA" ? getGeoJsonNameSelectorUX(migrantData.StartKarte) : false

    const startRegionNameUX = startNameSelectorUX
      ? getRegionNameUX(startRegionElement.datum(), startNameSelectorUX)
      : migrantData.StartRegion

    const endNameSelectorUX =
      migrantData.EndKarte !== "NA" ? getGeoJsonNameSelectorUX(migrantData.EndKarte) : false

    const endRegionData =
      migrantData.EndRegion !== "NA"
        ? d3.selectAll(`.${migrantData.EndKarte}-${migrantData.EndRegion}`).datum()
        : false

    const endRegionNameUX = endRegionData
      ? getRegionNameUX(endRegionData, endNameSelectorUX)
      : migrantData.EndRegion

    const migrantGender =
      migrantData.Geschlecht === "NA"
        ? "Geschlecht unbekannt"
        : migrantData.Geschlecht === "W"
          ? "Frau"
          : "Mann"

    const migrantType =
      migrantData.Geschlecht === "NA"
        ? migrantData.Wanderungstyp === "Zuzug"
          ? "Zuzüger:in"
          : "Wegzüger:in"
        : migrantData.Geschlecht === "W"
          ? migrantData.Wanderungstyp === "Zuzug"
            ? "Zuzügerin"
            : "Wegzügerin"
          : migrantData.Wanderungstyp === "Zuzug"
            ? "Zuzüger"
            : "Wegzüger"

    const migrantAge =
      migrantData.Alter === "NA"
        ? "Alter unbekannt"
        : migrantData.Alter === "1"
          ? `${migrantData.Alter} Jahr alt`
          : `${migrantData.Alter} Jahre alt`

    const migrantNationality =
      migrantData.Geschlecht === "NA"
        ? migrantData.Staatsangehoerigkeit === "NA"
          ? "Staatsangehörigkeit unbekannt"
          : migrantData.Staatsangehoerigkeit === "Schweizer"
            ? "Schweizer:in"
            : "Ausländer:in"
        : migrantData.Geschlecht === "W"
          ? migrantData.Staatsangehoerigkeit === "Schweizer"
            ? "Schweizerin"
            : "Ausländerin"
          : migrantData.Staatsangehoerigkeit

    const migrantFrom = migrantData.StartRegion === "NA" ? "Herkunft unbekannt" : startRegionNameUX
    const migrantTo = migrantData.EndRegion === "NA" ? "Ziel unbekannt" : endRegionNameUX

    migrantTooltip.select("#migrant-type").text(migrantType).style("font-weight", "bold")
    migrantTooltip.select("#migrant-gender").text(`${migrantGender}, `)
    migrantTooltip.select("#migrant-age").text(migrantAge)
    migrantTooltip.select("#migrant-nationality").text(migrantNationality)
    migrantTooltip.select("#migrant-from").text(`Von: ${migrantFrom}`)
    migrantTooltip.select("#migrant-to").text(`Nach: ${migrantTo}`)

    migrantTooltip
      .style("display", event.type === "mouseover" ? "block" : "none")
      .style("left", `${migrant.attr("cx")}px`)
      .style("top", `${parseInt(migrant.attr("cy")) + 50}px`)
  })
}
</script>

<template>
  <div id="region-tooltip" class="tooltip"></div>
  <div id="migrant-tooltip" class="tooltip">
    <div id="migrant-type"></div>
    <div><span id="migrant-gender"></span><span id="migrant-age"></span></div>
    <div id="migrant-nationality"></div>
    <div id="migrant-from"></div>
    <div id="migrant-to"></div>
  </div>
  <n-flex vertical style="flex: 1">
    <TheControls
      :animation-ongoing="animationOngoing"
      @start-animation="startAnimation"
      @stop-animation="stopAnimation"
      @toggle-paths="togglePaths"
    />
    <div id="basel-migration">
      <n-flex v-if="!mapsDrawn" justify="center">
        <n-spin />
      </n-flex>
    </div>
  </n-flex>
</template>

<style scoped>
.tooltip {
  position: absolute;
  background-color: black;
  border: solid 1px white;
  color: white;
  padding: 1px 5px 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  display: none;
}
</style>
