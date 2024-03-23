<script setup>
import { NFlex } from "naive-ui"
</script>

<template>
  <header>
    <n-flex>
      <div class="title-container">
        <b>Basel-Stadt: Zu- und Wegzüge seit 2006</b>
      </div>
      <div class="nav-container">
        <nav>
          <RouterLink to="/about">Über</RouterLink>
        </nav>
      </div>
    </n-flex>
  </header>
</template>

<style scoped>
header {
  padding: 1rem;
}
.title-container {
  flex: 4;
  font-size: 1.1rem;
}
.nav-container {
  display: flex;
  flex: 1;
  justify-content: end;
}
</style>
