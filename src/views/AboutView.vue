<script setup>
import { NFlex } from "naive-ui"
</script>
<template>
  <n-flex vertical>
    <div class="about-column" style="flex: 1">
      <p>
        Die vorliegende Website ist ein unabhängiges Projekt, das auf Daten von
        <a href="https://data.bs.ch/pages/home/" target="_blank">Open Data Basel-Stadt</a>
        basiert. Sie ist keine offizielle Veröffentlichung und wurde nicht von der Stadt Basel in
        Auftrag gegeben.
      </p>

      <p>
        Die zugrunde liegenden Daten zur Basler Migration stammen vom Statistischen Amt Basel-Stadt
        und sind über folgenden Link abrufbar:<br />
        <a href="https://data.bs.ch/explore/dataset/100138/table/" target="_blank"
          >https://data.bs.ch/explore/dataset/<br />100138/table/</a
        >.
      </p>

      <p>
        Auf der Website werden Zuzüge und Wegzüge seit 2006 visualisiert, wobei auf die Darstellung
        innerstädtischer Umzüge verzichtet wird.
      </p>

      <p>
        Die Daten wurden entsprechend für die Verwendung auf der Website transformiert. Alle
        Verarbeitungsschritte sind in einem separaten GitHub-Repository dokumentiert:<br />
        <a href="https://github.com/cyrill-martin/basel-migration-data" target="_blank"
          >https://github.com/cyrill-martin/<br />basel-migration-data</a
        >.
      </p>

      <p>
        Der Code für die Website und die Visualisierungen, einschliesslich der Kartendateien für
        Basel, die Schweiz, Europa und die Welt, ist hier verfügbar:<br />
        <a href="https://github.com/cyrill-martin/basel-migration" target="_blank"
          >https://github.com/cyrill-martin/<br />basel-migration</a
        >.
      </p>

      <p>
        Die Karte von Basel-Stadt wurde vom Geoportal des Kantons Basel-Stadt bezogen:<br />
        <a href="https://data.bs.ch/api/v2/catalog/datasets/100042/exports/geojson" target="_blank"
          >https://data.bs.ch/api/v2/catalog/<br />datasets/100042/exports/geojson</a
        >.
      </p>

      <p>
        Die Schweizer Karte basiert auf der GeoJSON-Datei swissBOUNDARIES3D_1_3_TLM_KANTONSGEBIET,
        bereitgestellt von
        <a href="https://www.swisstopo.admin.ch/" target="_blank">swisstopo</a>:<br />
        <a
          href="https://www.swisstopo.admin.ch/de/landschaftsmodell-swissboundaries3d"
          target="_blank"
          >https://www.swisstopo.admin.ch/de/<br />landschaftsmodell-swissboundaries3d</a
        >.
      </p>
    </div>
    <div class="about-column" style="flex: 1">
      <n-flex>
        <div style="flex: 1">
          <p><img src="../assets/kmapper_k.png" alt="The small kmapper k logo" /></p>
        </div>
        <div style="flex: 25">
          <p>
            Cyrill Martin <br />
            <a href="https://kmapper.com" target="_blank">kmapper GmbH</a><br />
            <a href="mailto:cyrill.martin@kmapper.com">cyrill.martin@kmapper.com</a>
          </p>
        </div>
      </n-flex>
    </div>
  </n-flex>
</template>

<style scoped>
.about-column {
  margin: auto;
  width: 75%;
}

p {
  margin-bottom: 2rem;
}

img {
  height: 60px;
}

@media only screen and (max-width: 1200px) {
  .about-column {
    margin: auto;
    width: 100%;
    font-size: 12px;
  }
  img {
  height: 57px;
}
}
</style>
