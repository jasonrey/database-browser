<template lang="pug">
  .item.item-hover.item-border.p-5.mv-10(@click="$emit('click')")
    .monospace.mb-5 {{ item.query }}
    button.btn.btn-link.btn-xs.close-button(@click.stop="$emit('remove')")
      i.glyphicon.glyphicon-remove
    .flex.small.text-muted
      span(v-if="item.selectedDatabase") @{{ item.selectedDatabase }}
      .flex-grow
      span {{ date }}

</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .close-button
    position: absolute
    top: 0
    right: 0
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
