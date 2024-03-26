import { ref, computed } from "vue"
import { defineStore } from "pinia"

export const useScreenSizeStore = defineStore("screenSize", () => {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  const isMobile = computed(() => width.value < 600)

  function updateScreenSize() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  return { width, height, isMobile, updateScreenSize }
})
