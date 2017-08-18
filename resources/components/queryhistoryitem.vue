<template lang="pug">
  .item.item-hover.item-border.p-5.mv-10(
    @click="$emit('click')"
    :class="{ 'bg-success': item.state === true, 'bg-error': item.state === false }"
  )
    .monospace.mb-5 {{ item.query }}
    .meta.flex.small.text-muted(v-if="item.state === true")
      span(v-if="item.selectedDatabase") @{{ item.selectedDatabase }}
      span.flex-grow
      span.mr-5(v-if="item.fields && item.result") {{ item.result.length }} row{{ item.result.length > 1 ? 's' : '' }}
      span.mr-5 {{ (item.time / 1000).toFixed(2) }}s
      span {{ date }}
    .bg-danger.p-10(v-if="item.state === false") {{ item.err }}
</template>

<style lang="sass" scoped>
  @import '../sass/colors'

</style>

<script>
const moment = require('moment')

export default {
  props: ['item'],

  computed: {
    date() {
      return moment(this.item.date).format('YYYY-MM-DD HH:mm:ss')
    }
  }
}
</script>
