<template>
  <div id="app">
    <ExcelImport />
  </div>
</template>

<script>
import ExcelImport from "../packages/excel"
export default {
  name: "App",
  components: { ExcelImport },
  data() {
    return {}
  },
}
</script>

<style scoped>
#app {
  width: 100%;
  min-height: 100%;
}
</style>
