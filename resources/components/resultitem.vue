<template lang="pug">
  .result-item
    .meta.flex.bg-info
      button.btn.btn-link.btn-xs.flex-no-shrink(v-if="selected", @click="$emit('viewHistory')")
        i.glyphicon.glyphicon-menu-left
        span History
      .query.flex-grow.monospace select * from blablablbal

      span.small.flex-no-shrink 12 rows
      span.small.flex-no-shrink 1.12s
      span.small.flex-no-shrink 2017-07-10 00:00:00

      button.btn.btn-link.btn-xs.flex-no-shrink(v-if="!selected", @click="$emit('viewResult')") View Full Result
        i.glyphicon.glyphicon.glyphicon-menu-right
    .result
      table.table.table-condensed.table-hover.table-striped
        thead
          tr
            th id
            th name
        tbody
          tr
            td 1
            td Test
          tr
            td 2
            td Test

</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .result-item
    border: 1px solid $gray-light
    margin: 0 0 10px 0

  .meta
    > *
      margin: 0 5px

  .query
    padding: 5px

  .result
    table
      margin: 0

</style>

<script>
  export default {
    props: ['selected']
  }
</script>
