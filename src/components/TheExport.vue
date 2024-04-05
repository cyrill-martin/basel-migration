<script setup>
import { NSpace, NButton } from "naive-ui"
import { saveSvgAsPng } from "save-svg-as-png"

const props = defineProps(["year", "month", "animationOngoing"])

function exportImage() {
  const svgElement = document.getElementById("svg-chart")
  const filename = `basel-migration_${props.year}-${props.month}`
  saveSvgAsPng(svgElement, filename, { backgroundColor: "white" })
}

function openLinkInTab() {
  const url = `https://data.bs.ch/explore/embed/dataset/100138/table/?disjunctive.ereignis_typ&disjunctive.jahr&disjunctive.monat&disjunctive.woche_in_jahr&disjunctive.tag_in_jahr&disjunctive.alter&disjunctive.aufenthaltsdauer_in_jahren&disjunctive.von_kontinent&disjunctive.von_land&disjunctive.von_kanton&disjunctive.von_gemeinde&disjunctive.von_wohnviertel&disjunctive.nach_kontinent&disjunctive.nach_land&disjunctive.nach_kanton&disjunctive.nach_gemeinde&disjunctive.nach_wohnviertel&sort=datum&refine.ereignis_typ=Zuzug&refine.ereignis_typ=Wegzug&refine.jahr=${props.year}&refine.monat=${props.month}`

  window.open(url, "_blank")
}
</script>

<template>
  <n-space justify="end">
    <n-button
      v-show="props.year && props.month"
      size="tiny"
      @click="openLinkInTab"
      :disabled="props.animationOngoing"
      color="rgb(51, 52, 71)"
      >Daten anzeigen</n-button
    >
    <n-button
      size="tiny"
      @click="exportImage"
      :disabled="props.animationOngoing"
      color="rgb(51, 52, 71)"
      >Bild speichern</n-button
    >
  </n-space>
</template>
