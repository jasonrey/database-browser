<template lang="pug">
  div
    .bg-danger.p-5.small {{ item.err }}
    .bg-info.monospace.p-5.small(v-if="item.payload") {{ JSON.stringify(item.payload) }}
</template>

<style lang="sass" scoped>
</style>

<script>
export default {
  props: ['item']
}
</script>
