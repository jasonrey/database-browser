<template lang="pug">
  .item.clearfix(:data-tag="server && server.data.color")
    .tag.abs.abs-full-height
    .connectionname.item-hover(@click="selectServer(server)", @dblclick="connectServer(server)")
      strong {{ connectionname || '⚡ Quick Connect' }}

    .actions(v-if="server !== null")
      button.btn.btn-sm.btn-link(@click="deleteServer(server)")
        i.glyphicon.glyphicon-remove
</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .item
    border-bottom: 1px solid $gray-light

    &:first-child
      border-bottom-width: 2px

    &:last-child
      border-bottom: 0

    &:hover
      .actions
        opacity: 1

    &.active
      background-color: rgba($brand-info, 0.1)

  .connectionname
    padding: 10px

  .actions
    position: absolute
    top: 50%
    right: 4px
    transform: translateY(-50%)
    opacity: 0

  [data-tag]
    .tag
      left: 0
      width: 4px

  [data-tag="red"]
    .tag
      background-color: $tag-red

  [data-tag="orange"]
    .tag
      background-color: $tag-orange

  [data-tag="yellow"]
    .tag
      background-color: $tag-yellow

  [data-tag="green"]
    .tag
      background-color: $tag-green

  [data-tag="blue"]
    .tag
      background-color: $tag-blue

  [data-tag="purple"]
    .tag
      background-color: $tag-purple

</style>

<script>
  import { mapState, mapMutations, mapActions } from 'vuex'

  export default {
    props: ['server'],

    computed: {
      connectionname() {
        if (this.server === null) {
          return ''
        }

        return this.server.data.name || this.server.data.host
      },

      ...mapState([
        'selectedServer'
      ])
    },

    methods: {
      ...mapMutations([
        'selectServer'
      ]),

      ...mapActions([
        'deleteServer'
      ]),

      connectServer(server) {
        this.selectServer(server)

        this.$emit('connect')
      },

      deleteServer(server) {
        const result = confirm('Delete the server - ' + (server.data.name || server.data.host))

        if (result) {
          this.$store.dispatch('deleteServer', server)
        }
      }
    }
  }
</script>
