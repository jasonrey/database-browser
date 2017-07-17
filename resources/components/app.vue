<template lang="pug">
  main.flex.flex-column
    ul.nav.nav-tabs.flex-no-grow.flex-no-shrink.bg-muted
      servernav(
        v-for="connection in connections"
        :key="connection.adapter.id"
        :connection="connection"
        :class="{ active: connection === selectedConnection }"
      )

      li(
        :class="{ active: selectedConnection === null }"
        @click="selectConnection(null)"
      )
        a(href="javascript:;")
          i.glyphicon.glyphicon-plus
      li.pull-right(
        :class="{ active: selectedConnection === false }"
        @click="selectConnection(false)"
      )
        a(href="javascript:;") Log
    .flex-grow
      servercontent(
        v-for="connection in connections"
        :key="connection.adapter.id"
        :connection="connection",
        :class="{ active: connection === selectedConnection }"
      )

      newconnection(:class="{ active: selectedConnection === null }")

      .active-only.abs.abs-full-size.overflow-auto(:class="{ active: selectedConnection === false }")
        logitem(
          v-for="log in logs"
          :key="log.hash"
          :item="log"
        )

</template>

<style lang="sass">
  @import '../sass/colors'

  main
    height: 100%
    overflow: hidden

  .connection-form
    align-items: center
    margin: 10px 0

    @media (max-height: 600px)
      align-items: initial

  .connection-colors
    button
      width: 24px
      height: 24px
      border-radius: 50%
      border: 1px solid transparent
      outline: none
      padding: 3px
      font-size: 0
      vertical-align: top
      margin: 0 5px 0 0
      background-color: transparent

      &::before
        content: ''
        display: block
        width: 100%
        height: 100%
        border-radius: 50%

      &:hover
        background-color: $gray-lighter
        border-color: $gray-light

      &.btn
        font-size: 14px

        &::before
          display: none

        &:hover
          background-color: transparent

      &.active
        background-color: $gray-light
        border-color: $gray

    .red
      &::before
        background-color: $tag-red

    .orange
      &::before
        background-color: $tag-orange

    .yellow
      &::before
        background-color: $tag-yellow

    .green
      &::before
        background-color: $tag-green

    .blue
      &::before
        background-color: $tag-blue

    .purple
      &::before
        background-color: $tag-purple

</style>

<script>
  import { mapState, mapMutations } from 'vuex'


  import servernav from './servernav.vue'
  import servercontent from './servercontent.vue'
  import newconnection from './newconnection.vue'

  import logitem from './logitem.vue'

  import Connection from '../js/classes/Connection.js'
  import Server from '../js/classes/Server.js'

  export default {
    components: {
      servernav,
      servercontent,
      newconnection,
      logitem
    },

    computed: {
      ...mapState('server', {
        servers: 'items',
        selectedServer: 'selected',
      }),

      ...mapState('connection', {
        connections: 'items',
        selectedConnection: 'selected',
        isConnecting: 'connecting',
        connectionError: 'error',
        newconnection: 'form'
      }),

      logs() {
        if (!this.$store) {
          return []
        }

        return this.$store.state.log.items.slice().reverse()
      }
    },

    created() {
      this.$store.commit('server/init')
    },

    methods: {
      ...mapMutations('connection', {
        selectConnection: 'select'
      })
    }
  }
</script>
