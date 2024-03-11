<script setup>
import { onMounted, ref, computed } from "vue"
import * as d3 from "d3"
import { useScreenSizeStore } from "../stores/screenSize.js"

const screenSize = useScreenSizeStore()

const mapAreaHeight = computed(() => screenSize.height * 0.8)

onMounted(async () => {
  await loadMaps()
  initiateSvg()
  drawMaps()
})

// Load the maps //////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const baselMap = ref(null)
const switzerlandMap = ref(null)
const europeMap = ref(null)
// const worldMap = ref(null)

async function loadMapData(mapFile) {
  const response = await fetch(`/data/${mapFile}`)
  const mapData = await response.json()
  return mapData
}

async function loadMaps() {
  baselMap.value = await loadMapData("basel.geojson")
  switzerlandMap.value = await loadMapData("switzerland.geojson")
  europeMap.value = await loadMapData("europe.geojson")
}

// Create the SVG /////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
const svg = ref(null)
const ctr = ref(null)

const baselCtr = ref(null)
const switzerlandCtr = ref(null)
const europeCtr = ref(null)

function initiateSvg() {
  // Draw <svg> canvas
  svg.value = d3
    .select("#basel-migration")
    .append("svg")
    .attr("id", "svg-chart")
    .attr("viewBox", `0 0 ${screenSize.width} ${mapAreaHeight.value}`)

  // Add <g> container with margins to avoid overlapping
  ctr.value = svg.value.append("g").attr("id", "chart-ctr").attr("transform", `translate(0, 0)`)
}

// Draw the maps //////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
function drawMaps() {
  drawBasel()
  drawSwitzerland()
  drawEurope()
}

function drawBasel() {
  const projection = d3
    .geoMercator()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], baselMap.value)

  const path = d3.geoPath().projection(projection)

  baselCtr.value = ctr.value
    .append("g")
    .attr("id", "basel-ctr")
    .attr("transform", `translate(0, 0)`)

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

function drawSwitzerland() {
  const projection = d3
    .geoMercator()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], switzerlandMap.value)

  const path = d3.geoPath().projection(projection)

  switzerlandCtr.value = ctr.value
    .append("g")
    .attr("id", "switzerland-ctr")
    .attr("transform", `translate(0, ${mapAreaHeight.value / 2})`)

  switzerlandCtr.value
    .selectAll("path")
    .data(switzerlandMap.value.features)
    .enter()
    .append("path")
    .attr("class", (d) => d.properties.NAME)
    .attr("d", path)
    .style("fill", (d) => {
      return d.properties.NAME === "Basel-Stadt" ? "lightgrey" : "black"
    })
    .style("stroke", "white")
    .style("stroke-width", "1px")
}

function drawEurope() {
  const projection = d3
    .geoMercator()
    .fitSize([screenSize.width / 2, mapAreaHeight.value / 2], europeMap.value)

  const path = d3.geoPath().projection(projection)

  europeCtr.value = ctr.value
    .append("g")
    .attr("id", "europe-ctr")
    .attr("transform", `translate(${screenSize.width / 2}, 0)`)

    europeCtr.value
    .selectAll("path")
    .data(europeMap.value.features)
    .enter()
    .append("path")
    .attr("class", (d) => d.properties.name)
    .attr("d", path)
    .style("fill", (d) => {
      return d.properties.name === "Switzerland" ? "lightgrey" : "black"
    })
    .style("stroke", "white")
    .style("stroke-width", "0.5px");
}
</script>

<template>
  <div id="basel-migration"></div>
</template>

<style scoped></style>