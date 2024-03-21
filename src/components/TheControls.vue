<script setup>
import { NSpin, NSpace, NSelect, NIcon } from "naive-ui"
import { ref, computed } from "vue"

import { PlaySkipBack, Play, Pause, PlaySkipForward } from "@vicons/ionicons5"

const props = defineProps(["isLoading"])
const showSpinner = computed(() => props.isLoading)

const selectedYear = ref(null)
const selectedMonth = ref(null)

const years = [
  {
    label: "2021",
    value: 2021
  },
  {
    label: "2022",
    value: 2022
  }
]

const months = [
  {
    label: "Januar",
    value: 1
  },
  {
    label: "Februar",
    value: 2
  }
]

const iconSize = ref("20")
</script>

<!-- <template>
  <n-space vertical>
    <div>
      <n-space justify="end">
        <n-select placeholder="Monat" v-model:value="selectedMonth" :options="months" />
        <n-select placeholder="Jahr" v-model:value="selectedYear" :options="years" />
      </n-space>
    </div>
    <div>
      <n-space justify="end">
        <n-icon :size="iconSize" :component="PlaySkipBack" />
        <n-icon v-if="selectedMonth && selectedYear" :size="iconSize" :component="Play" />
        <n-icon :size="iconSize" :component="Pause" />
        <n-icon :size="iconSize" :component="PlaySkipForward" />
        <p v-if="showSpinner">Daten werden geladen...<n-spin /></p>
      </n-space>
    </div>
  </n-space>
</template> -->
