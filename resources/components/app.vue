<template lang="pug">
  main.flex.flex-column
    ul.nav.nav-tabs.flex-no-grow.flex-no-shrink.bg-muted
      servernav(
        v-for="(connection, index) in connections"
        :key="connection.id"
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
        v-for="(connection, index) in connections"
        :key="connection.id"
        :connection="connection",
        :class="{ active: connection === selectedConnection }"
      )

      .active-only.active-flex.abs.abs-full-size(:class="{ active: selectedConnection === null }")
        .sidebar.flex-no-shrink.overflow-auto
          serveritem(
            :server="null"
            :class="{ active: selectedServer === null }"
          )
          serveritem(
            v-for="server in servers"
            :key="server.id"
            :server="server"
            :class="{ active: selectedServer === server }"
          )

        .connection-form.flex-grow.flex.overflow-auto
          .col-xs-6.col-xs-offset-3.text-center(v-show="isConnecting")
            p Connecting...
            .btn.btn-danger(@click="isConnecting = false") Cancel
          form.col-xs-6.col-xs-offset-3(@submit.prevent="createConnection", v-show="!isConnecting")
            .alert.alert-warning(v-if="connectionError") {{ connectionError }}
            .form-group
              input.form-control(placeholder="Connection Name", v-model="newconnection.name", tabindex="1")

            .form-group
              .connection-colors
                button.btn.btn-link.btn.xs(type="button", @click="newconnection.color = null")
                  i.glyphicon.glyphicon-remove
                button.red(
                  type="button"
                  @click="newconnection.color = 'red'"
                  :class="{ active: newconnection.color === 'red' }"
                ) Red
                button.orange(
                  type="button"
                  @click="newconnection.color = 'orange'"
                  :class="{ active: newconnection.color === 'orange' }"
                ) Orange
                button.yellow(
                  type="button"
                  @click="newconnection.color = 'yellow'"
                  :class="{ active: newconnection.color === 'yellow' }"
                ) Yellow
                button.green(
                  type="button"
                  @click="newconnection.color = 'green'"
                  :class="{ active: newconnection.color === 'green' }"
                ) Green
                button.blue(
                  type="button"
                  @click="newconnection.color = 'blue'"
                  :class="{ active: newconnection.color === 'blue' }"
                ) Blue
                button.purple(
                  type="button"
                  @click="newconnection.color = 'purple'"
                  :class="{ active: newconnection.color === 'purple' }"
                ) Purple

            hr

            .form-group
              input.form-control(
                tabindex="2"
                placeholder="Host"
                v-model="newconnection.host"
              )
              input.form-control(
                tabindex="3"
                placeholder="Username"
                v-model="newconnection.username"
              )
              input.form-control(
                tabindex="4"
                type="password"
                placeholder="Password"
                v-model="newconnection.password"
              )
              input.form-control(
                tabindex="5"
                placeholder="Database"
                v-model="newconnection.database"
              )
              input.form-control(
                tabindex="6"
                type="number"
                placeholder="Port"
                v-model="newconnection.port"
              )

            .checkbox
              label
                input(
                  tabindex="7"
                  type="checkbox"
                  v-model="newconnection.useSSH"
                )
                =" Use SSH"

            .form-group(v-show="newconnection.useSSH")
              input.form-control(
                tabindex="8"
                placeholder="SSH Host"
                v-model="newconnection.sshhost"
              )
              input.form-control(
                tabindex="9"
                placeholder="SSH Username"
                v-model="newconnection.sshusername"
              )
              input.form-control(
                tabindex="10"
                type="password"
                placeholder="SSH Password"
                v-model="newconnection.sshpassword"
              )
              input.form-control(
                tabindex="11"
                type="number"
                placeholder="SSH Port"
                v-model="newconnection.sshport"
              )

            hr

            .btn-group.btn-group-justified
              .btn-group
                button.btn.btn-block.btn-lg.btn-danger(
                  type="button"
                  tabindex="14"
                  @click="selectServer(null)"
                )
                  i.glyphicon.glyphicon-remove

              .btn-group(v-if="selectedServer")
                button.btn.btn-block.btn-lg.btn-primary(
                  type="button"
                  tabindex="13"
                  :disabled="!formFilled"
                  @click="saveServer(newconnection)"
                )
                  i.glyphicon.glyphicon-floppy-saved

              .btn-group(v-if="!selectedServer")
                button.btn.btn-block.btn-lg.btn-primary(
                  type="button"
                  tabindex="13"
                  :disabled="!formFilled"
                  @click="saveServer(newconnection)"
                )
                  i.glyphicon.glyphicon-plus

              .btn-group
                button.btn.btn-block.btn-lg.btn-success(
                  tabindex="12"
                  :disabled="!formFilled"
                )
                  i.glyphicon.glyphicon-ok

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
  import { mapState, mapMutations, mapActions } from 'vuex'
  import servernav from './servernav.vue'
  import servercontent from './servercontent.vue'
  import serveritem from './serveritem.vue'

  import logitem from './logitem.vue'

  import Connection from '../js/classes/Connection.js'
  import Server from '../js/classes/Server.js'

  export default {
    components: {
      servernav,
      servercontent,
      serveritem,
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

      ...mapState('log', {
        logs: 'items'
      }),

      formFilled() {
        if (!this.newconnection.host ||
          !this.newconnection.username ||
          !this.newconnection.password ||
          !this.newconnection.port || (
            this.newconnection.useSSH && (
              !this.newconnection.sshhost ||
              !this.newconnection.sshusername ||
              !this.newconnection.sshpassword ||
              !this.newconnection.sshport
            )
          )
        ) {
          return false
        }

        return true
      }
    },

    created() {
      this.$store.commit('server/init')
    },

    methods: {
      ...mapMutations('connection', {
        selectConnection: 'select'
      }),

      ...mapActions('connection', {
        createConnection: 'create'
      }),

      ...mapActions('server', {
        selectServer: 'select',
        saveServer: 'save'
      })
    }
  }
</script>
