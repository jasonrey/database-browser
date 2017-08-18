<template lang="pug">
  div
    .bg-primary.monospace.p-5.small {{ item.query }}
    .payload.bg-info.monospace.p-5.small(v-if="item.values && item.values.length") {{ JSON.stringify(item.values) }}
    .bg-warning(v-if="item.fields", @click="showResult = !showResult")
      button.btn.btn-link.btn-sm
        i.glyphicon.glyphicon-plus(v-show="!showResult")
        i.glyphicon.glyphicon-minus(v-show="showResult")
        span.inline-block.ml-5 Toggle Result
    .bg-warning.p-5.queryresult.overflow-auto(v-if="showResult")
      table.table.table-hover.table-condensed.small.m-0
        thead
          tr
            th(v-for="field in item.fields", :key="field.name") {{ field.name }}
        tbody
          tr(v-for="(row, index) in item.result", :key="index")
            td(v-for="field in item.fields", :key="index + '-' + field.name") {{ row[field.name] }}
</template>

<style lang="sass" scoped>
  .queryresult
    max-height: 400px

</style>

<script>
export default {
  props: ['item'],

  data() {
    return {
      showResult: false
    }
  }
}
</script>
