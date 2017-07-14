<template lang="pug">
  .item
    h5.flex.flex-align-items-center
      .small {{ item.date }}
      span {{ item.type + (item.action ? ' - ' + item.action : '') }}
      .flex-grow
      .monospace {{ item.connection.username }}@{{ item.connection.host }}:{{ item.connection.port }}

    div(:is="`log${item.type}`", :item="item")

</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .small
    color: $gray
    margin: 0 5px 0 0

  .item
    margin: 0 10px
    padding: 10px 0
    border-bottom: 1px solid $gray-light
</style>

<script>
  import logaction from './logaction.vue'
  import logerror from './logerror.vue'
  import logquery from './logquery.vue'

  export default {
    props: ['item'],

    components: {
      logaction,
      logerror,
      logquery
    }
  }
</script>
