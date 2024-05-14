<script setup>
import { NFlex } from "naive-ui"
import { useRouter, useRoute } from "vue-router"

// Use the router
const router = useRouter()
const route = useRoute()

function goHome() {
  if (route.name === "about") {
    router.push({
      name: "home"
    })
  }
}
</script>

<template>
  <header>
    <n-flex>
      <div style="flex: 2">
        <div class="title-container">
          <span class="h1" @click="goHome">Basel-Stadt: Zu- und Wegzüge</span><br />
          <span class="h2" @click="goHome">Januar 2006 bis Dezember 2023</span>
        </div>
      </div>
      <div style="flex: 1">
        <div class="nav-container" v-show="route.name === 'home'">
          <nav>
            <RouterLink to="/about">Über</RouterLink>
          </nav>
        </div>
      </div>
    </n-flex>
  </header>
</template>

<style scoped>
header {
  padding: 1rem;
}
.h1 {
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
}
.h2 {
  font-size: 0.85rem;
  cursor: pointer;
}
.title-container {
  height: 45px;
  flex: 4;
  justify-content: start;
}
.nav-container {
  display: flex;
  flex: 1;
  justify-content: end;
}

@media only screen and (max-width: 1200px) {
  .h1 {
    font-size: 0.8rem;
    font-weight: bold;
  }
  .h2 {
    font-size: 0.75rem;
  }
}
</style>
