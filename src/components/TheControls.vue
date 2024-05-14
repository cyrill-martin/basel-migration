<script setup>
import d3 from "../d3-importer.js"
import {
  NFlex,
  NSpin,
  NSpace,
  NSelect,
  NIcon,
  NRadioGroup,
  NRadioButton,
  NSwitch,
  NTooltip
} from "naive-ui"
import { ref, computed } from "vue"
import { loadMigrationChunk } from "../utils/loadMigrationChunk.js"

import {
  ChevronBackCircleOutline,
  Play,
  Stop,
  ChevronForwardCircleOutline
} from "@vicons/ionicons5"
import TheExport from "./TheExport.vue"

const maxYear = 2023
const maxMonth = 12

const selectedYear = ref(null)
const selectedMonth = ref(null)

const invalidSelection = computed(() => {
  return selectedMonth.value > maxMonth && selectedYear.value === maxYear
})

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

const props = defineProps(["animationOngoing"])
const emit = defineEmits(["startAnimation", "stopAnimation", "togglePaths"])

const isLoading = ref(false)
const migrationData = ref(null)

async function loadMigrationData(migrationChunk) {
  const dataChunk = await loadMigrationChunk(migrationChunk)
  const groupedData = d3.group(dataChunk, (d) => d.StartKarte)
  return groupedData
}

async function triggerDataLoading() {
  if (selectedMonth.value && selectedYear.value && !invalidSelection.value) {
    isLoading.value = true
    migrationData.value = await loadMigrationData(`${selectedYear.value}-${selectedMonth.value}`)
    isLoading.value = false
  } else {
    migrationData.value = null
  }
}

function skipDate(value) {
  let currentMonth = selectedMonth.value
  let currentYear = selectedYear.value

  if (currentMonth && currentYear) {
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
  }

  selectedMonth.value = currentMonth
  selectedYear.value = currentYear
}

const monthObj = computed(() => {
  return months.find((m) => m.value === selectedMonth.value)
})

const clickedPlay = ref(false)

async function startAnimation() {
  clickedPlay.value = true
  animationStopped.value = false
  toggleValue.value = false

  await triggerDataLoading()

  if (migrationData.value) {
    emit("startAnimation", {
      data: migrationData.value,
      speed: speed.value,
      date: { month: monthObj.value.label, year: selectedYear.value.toString() }
    })
  }
}

const animationStopped = ref(false)

function stopAnimation() {
  emit("stopAnimation")
  animationStopped.value = true
}

function togglePaths() {
  emit("togglePaths", toggleValue.value)
}

// Handle icon controls
const iconSize = ref("30")
const isActiveControl = computed(
  () => selectedMonth.value && selectedYear.value && !invalidSelection.value
)
const controlDepth = computed(() => (isActiveControl.value ? 1 : 5))

// Speed slider
const speed = ref(3)
const speeds = ref([
  { value: 1, label: "langsamer" },
  { value: 3, label: "normal" },
  { value: 5, label: "schneller" }
])

const toggleValue = ref(false)

const toolTipPlacement = computed(() => {
  return speed.value === 1 ? "bottom-start" : speed.value === 3 ? "bottom" : "bottom-end"
})
</script>

<template>
  <n-flex>
    <div style="flex: 1">
      <div style="flex: 1">
        <!-- Date selection -->
        <n-space justify="center">
          <!-- Month -->
          <n-select
            id="month-selection"
            :disabled="props.animationOngoing"
            class="date-selection"
            placeholder="Monat wählen"
            v-model:value="selectedMonth"
            :options="months"
            size="small"
          />
          <!-- Year -->
          <n-select
            id="year-selection"
            :disabled="props.animationOngoing"
            class="date-selection"
            placeholder="Jahr wählen"
            v-model:value="selectedYear"
            :options="years"
            size="small"
          />
          <div v-if="invalidSelection">
            <n-space justify="center"
              ><span class="date-selection-warning"
                >Daten sind nur bis Dezember 2023 vorhanden!</span
              ></n-space
            >
          </div>
        </n-space>
      </div>
      <div style="flex: 1; margin-top: 0.5rem">
        <n-space justify="center">
          <!-- Back -->
          <n-tooltip trigger="hover" placement="bottom" v-if="!props.animationOngoing">
            <template #trigger>
              <n-icon
                :class="{ activeControl: isActiveControl }"
                :size="iconSize"
                :depth="controlDepth"
                :color="'rgb(80, 80, 80)'"
                :component="ChevronBackCircleOutline"
                @click="skipDate(-1)"
              />
            </template>
            vorheriger Monat
          </n-tooltip>
          <!-- Play -->
          <n-tooltip
            trigger="hover"
            placement="bottom"
            v-if="!props.animationOngoing && !isLoading"
          >
            <template #trigger>
              <n-icon
                :class="{ activeControl: isActiveControl }"
                :size="iconSize"
                :depth="controlDepth"
                :component="Play"
                @click="startAnimation"
              />
            </template>
            Animation starten
          </n-tooltip>
          <!-- Spinner -->
          <n-spin v-if="isLoading" size="small" />
          <!-- Stop -->
          <n-tooltip trigger="hover" placement="bottom" v-if="props.animationOngoing">
            <template #trigger>
              <n-icon
                class="activeControl"
                :size="iconSize"
                :component="Stop"
                @click="stopAnimation"
              />
            </template>
            Animation abbrechen
          </n-tooltip>
          <!-- Forward -->
          <n-tooltip trigger="hover" placement="bottom" v-if="!props.animationOngoing">
            <template #trigger>
              <n-icon
                :class="{ activeControl: isActiveControl }"
                :size="iconSize"
                :depth="controlDepth"
                :color="'rgb(80, 80, 80)'"
                :component="ChevronForwardCircleOutline"
                @click="skipDate(1)"
              />
            </template>
            nächster Monat
          </n-tooltip>
        </n-space>
      </div>
    </div>
    <div style="flex: 1">
      <!-- Speed -->
      <n-space justify="center">
        <n-tooltip trigger="hover" :placement="toolTipPlacement">
          <template #trigger>
            <n-radio-group v-model:value="speed" size="small">
              <n-radio-button
                v-for="speed in speeds"
                :key="speed.value"
                :value="speed.value"
                :label="speed.label"
                :disabled="props.animationOngoing"
              />
            </n-radio-group>
          </template>
          Animationsgeschwindigkeit
        </n-tooltip>
      </n-space>
    </div>
    <div style="flex: 1">
      <div style="flex: 1">
        <!-- Paths -->
        <n-space justify="end">
          <n-switch
            size="small"
            v-model:value="toggleValue"
            @click="togglePaths"
            :disabled="props.animationOngoing || !migrationData || animationStopped"
          >
            <template #checked>Pfade sichtbar</template>
            <template #unchecked>Pfade ausgeblendet</template>
          </n-switch>
        </n-space>
      </div>
      <div style="flex: 1; margin-top: 0.5rem">
        <TheExport
          :year="selectedYear"
          :month="selectedMonth"
          :animation-ongoing="props.animationOngoing"
        />
      </div>
    </div>
  </n-flex>
</template>

<style scoped>
.date-selection {
  width: 150px;
}
.date-selection-warning {
  font-size: 12px;
  color: red;
}
.activeControl {
  cursor: pointer;
}
</style>
