<template lang="pug">
  .item.item-gutter.item-hover.item-border
    .query.monospace select * from blablabla
    button.btn.btn-link.btn-xs.close-button
      i.glyphicon.glyphicon-remove
    .meta.flex.small.text-muted
      .flex-grow
      span 2017-07-10 00:00:00

</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .close-button
    position: absolute
    top: 0
    right: 0

  .meta
    position: absolute
    bottom: 0
    right: 0

    > *
      margin: 0 5px

  .query
    padding: 20px 10px

</style>

<script>
  export default {

  }
</script>
