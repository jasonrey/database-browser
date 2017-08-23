<template lang="pug">
  li(:class="'tag-' + connection.server.color")
    a(
      href="javascript:;"
      @click="selectConnection(connection)"
      :data-status="status"
    )
      .mh-10 {{ connection.name }}

    button.btn.btn-link.btn-xs(@click="closeConnection(connection)")
      i.glyphicon.glyphicon-remove
</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  $tagColors: (red: $tag-red, orange: $tag-orange, yellow: $tag-yellow, green: $tag-green, blue: $tag-blue, purple: $tag-purple)

  .nav-tabs > li
    overflow: hidden

    > a
      &::after
        content: ''
        position: absolute
        top: 50%
        left: 10px
        width: 6px
        height: 6px
        border-radius: 50%
        background-color: red
        transform: translateY(-50%)

      &[data-status="connecting"]
        &::after
          background-color: yellow

      &[data-status="connected"]
        &::after
          background-color: green

      &::before
        content: ''
        position: absolute
        bottom: 0
        left: 0
        width: 100%
        height: 3px
        transform: translateY(4px)
        transition: transform .1s

    @each $tag, $color in $tagColors
      &.tag-#{$tag}
        > a
          background-color: rgba($color, .1)

          &::before
            background-color: $color

    &:hover
      @each $tag, $color in $tagColors
        &.tag-#{$tag}
          > a
            &::before
              transform: translateY(3px)

    &.active
      @each $tag, $color in $tagColors
        &.tag-#{$tag}
          > a
            background-color: rgba($color, .2)

            &::before
              transform: translateY(1px)

  li
    &:hover
      button
        display: block

  button
    position: absolute
    top: 50%
    right: 4px
    transform: translateY(-50%)
    display: none
</style>

<script>
import {mapMutations, mapActions} from 'vuex'

export default {
  props: ['connection'],

  computed: {
    status() {
      if (this.connection.status === null) {
        return 'connecting'
      }

      return this.connection.status ? 'connected' : false
    }
  },

  methods: {
    ...mapMutations({
      selectConnection: 'connection/select'
    }),

    ...mapActions({
      closeConnection: 'connection/close'
    })
  }
}
</script>
