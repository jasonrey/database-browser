<template lang="pug">
  div
    .bg-primary.monospace {{ item.query }}
    .payload.bg-info.monospace(v-if="item.values && item.values.length") {{ JSON.stringify(item.values) }}
</template>

<style lang="sass" scoped>
  .bg-primary, .bg-info
    padding: 10px
</style>

<script>
  export default {
    props: ['item']
  }
</script>
