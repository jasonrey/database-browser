<template lang="pug">
  .bg-info.monospace.small.p-5(v-if="item.payload") {{ JSON.stringify(item.payload) }}
</template>

<style lang="sass" scoped>
</style>

<script>
export default {
  props: ['item']
}
</script>
