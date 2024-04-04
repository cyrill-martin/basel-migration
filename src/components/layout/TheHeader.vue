<script setup>
import { NFlex } from "naive-ui"
</script>

<template>
  <header>
    <n-flex>
      <div class="title-container">
        <span class="h1">Basel-Stadt: Zu- und Wegzüge</span><br />
        <span class="h2">Januar 2006 bis Oktober 2023</span>
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
.h1 {
  font-size: 18px;
  font-weight: bold;
}
.h2 {
  font-size: 14px;
}
.title-container {
  flex: 4;
}
.nav-container {
  display: flex;
  flex: 1;
  justify-content: end;
}

@media only screen and (max-width: 1200px) {
  .h1 {
    font-size: 15px;
    font-weight: bold;
  }
  .h2 {
    font-size: 12;
  }
}
</style>
