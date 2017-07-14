<template lang="pug">
  div
    .bg-danger {{ item.err }}
    .bg-info.monospace(v-if="item.payload") {{ JSON.stringify(item.payload) }}
</template>

<style lang="sass" scoped>
  .bg-danger, .bg-info
    padding: 10px
</style>

<script>
  export default {
    props: ['item']
  }
</script>
