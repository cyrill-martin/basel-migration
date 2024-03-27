<script setup>
import * as d3 from "d3"
import { NSpin, NSpace, NSelect, NIcon, NSlider } from "naive-ui"
import { ref, computed } from "vue"
import { loadMigrationChunk } from "../utils/loadMigrationChunk.js"

import {
  ChevronBackCircleOutline,
  Play,
  Stop,
  ChevronForwardCircleOutline
} from "@vicons/ionicons5"

const years = [
  { label: "2006", value: 2006 },
  { label: "2007", value: 2007 },
  { label: "2008", value: 2008 },
  { label: "2009", value: 2009 },
  { label: "2010", value: 2010 },
  { label: "2011", value: 2011 },
  { label: "2012", value: 2012 },
  { label: "2013", value: 2013 },
  { label: "2014", value: 2014 },
  { label: "2015", value: 2015 },
  { label: "2016", value: 2016 },
  { label: "2017", value: 2017 },
  { label: "2018", value: 2018 },
  { label: "2019", value: 2019 },
  { label: "2020", value: 2020 },
  { label: "2021", value: 2021 },
  { label: "2022", value: 2022 },
  { label: "2023", value: 2023 }
].reverse()

const months = [
  { label: "Januar", value: 1 },
  { label: "Februar", value: 2 },
  { label: "März", value: 3 },
  { label: "April", value: 4 },
  { label: "Mai", value: 5 },
  { label: "Juni", value: 6 },
  { label: "Juli", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "Oktober", value: 10 },
  { label: "November", value: 11 },
  { label: "Dezember", value: 12 }
]

const selectedYear = ref(null)
const selectedMonth = ref(null)

const props = defineProps(["animationOngoing"])
const emit = defineEmits(["startAnimation", "stopAnimation"])

const isLoading = ref(false)
const migrationData = ref(null)

async function loadMigrationData(migrationChunk) {
  const dataChunk = await loadMigrationChunk(migrationChunk)
  const groupedData = d3.group(dataChunk, (d) => d.StartKarte)
  return groupedData
}

async function triggerDataLoading() {
  if (selectedMonth.value && selectedYear.value) {
    isLoading.value = true
    migrationData.value = await loadMigrationData(`${selectedYear.value}-${selectedMonth.value}`)
    isLoading.value = false
  }
}

function skipDate(value) {
  const maxYear = 2023
  const maxMonth = 9
  let currentMonth = selectedMonth.value
  let currentYear = selectedYear.value

  if (currentMonth === 12 && value === 1) {
    currentYear = currentYear === maxYear ? 2006 : currentYear + 1
    currentMonth = 1
  } else if (currentMonth === maxMonth && currentYear === maxYear && value === 1) {
    currentYear = 2006
    currentMonth = 1
  } else if (currentMonth === 1 && value === -1) {
    currentYear = currentYear === 2006 ? maxYear : currentYear - 1
    currentMonth = currentYear === maxYear ? maxMonth : 12
  } else {
    currentMonth += value
  }

  selectedMonth.value = currentMonth
  selectedYear.value = currentYear
}

async function startAnimation() {
  await triggerDataLoading()

  if (migrationData.value) {
    const monthObj = months.find((m) => m.value === selectedMonth.value)

    emit("startAnimation", {
      data: migrationData.value,
      speed: speed.value,
      date: { month: monthObj.label, year: selectedYear.value.toString() }
    })
  }
}

function stopAnimation() {
  emit("stopAnimation")
}

// Handle icon controls
const iconSize = ref("30")
const isActiveControl = computed(() => selectedMonth.value && selectedYear.value)
const controlDepth = computed(() => (isActiveControl.value ? 1 : 5))

// Speed slider
const speed = ref(3)
const marks = ref({
  1: "langsam",
  3: "",
  5: "schnell"
})
</script>

<template>
  <n-space vertical>
    <div>
      <n-space justify="center">
        <!-- Month -->
        <n-select
          :disabled="props.animationOngoing"
          class="date-selection"
          placeholder="Monat wählen"
          v-model:value="selectedMonth"
          :options="months"
        />
        <!-- Year -->
        <n-select
          :disabled="props.animationOngoing"
          class="date-selection"
          placeholder="Jahr wählen"
          v-model:value="selectedYear"
          :options="years"
        />
      </n-space>
    </div>
    <div>
      <n-space justify="center">
        <!-- Back -->
        <span v-show="!props.animationOngoing" :class="{ activeControl: isActiveControl }">
          <n-icon
            :size="iconSize"
            :depth="controlDepth"
            :component="ChevronBackCircleOutline"
            @click="skipDate(-1)"
          />
        </span>
        <!-- Play -->
        <span
          v-if="!props.animationOngoing && !isLoading"
          :class="{ activeControl: isActiveControl }"
        >
          <n-icon
            :size="iconSize"
            :depth="controlDepth"
            :component="Play"
            @click="startAnimation"
          />
        </span>
        <!-- Spinner -->
        <n-spin v-if="isLoading" size="small" />
        <!-- Stop -->
        <span v-if="props.animationOngoing">
          <n-icon class="activeControl" :size="iconSize" :component="Stop" @click="stopAnimation" />
        </span>
        <!-- Forward -->
        <span v-show="!props.animationOngoing" :class="{ activeControl: isActiveControl }">
          <n-icon
            :size="iconSize"
            :depth="controlDepth"
            :component="ChevronForwardCircleOutline"
            @click="skipDate(1)"
          />
        </span>
      </n-space>
    </div>
    <div>
      <n-space justify="center">
        <n-slider
          class="speed-selection"
          v-model:value="speed"
          :marks="marks"
          :step="2"
          :min="1"
          :max="5"
          :steps="3"
          :tooltip="false"
          :disabled="props.animationOngoing"
        />
      </n-space>
    </div>
  </n-space>
</template>

<style scoped>
.date-selection {
  width: 150px;
}
.activeControl {
  cursor: pointer;
}
.speed-selection {
  width: 310px;
}
</style>
