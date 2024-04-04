<script setup>
import { NSpace, NButton } from "naive-ui"
import { saveSvgAsPng } from "save-svg-as-png"

const props = defineProps(["year", "month"])

function exportImage() {
  const svgElement = document.getElementById("svg-chart")
  const filename = `basel-migration_${props.year}-${props.month}`
  saveSvgAsPng(svgElement, filename, {backgroundColor: "white"})
}
</script>

<template>
  <n-space justify="end">
    <n-button size="tiny" @click="exportImage">Bild speichern</n-button>
  </n-space>
</template>
