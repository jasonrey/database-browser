<template lang="pug">
  main.flex.flex-column
    ul.nav.nav-tabs.flex-no-grow.flex-no-shrink.bg-muted
      servernav(v-for="(connection, index) in connections", :key="connection.id", :connection="connection", :class="{ active: connection === selectedConnection }")

      li(:class="{ active: selectedConnection === null }", @click="selectConnection(null)")
        a(href="javascript:;")
          i.glyphicon.glyphicon-plus
    .flex-grow
      servercontent(v-for="(connection, index) in connections", :key="connection.id", :connection="connection", :class="{ active: connection === selectedConnection }")

      .active-only.active-flex.abs.abs-full-size(:class="{ active: selectedConnection === null }")
        .sidebar.flex-no-shrink.overflow-auto
          serveritem(:server="null", :class="{ active: selectedServer === null }")
          serveritem(v-for="(server, index) in servers", :key="index", :server="server", :class="{ active: selectedServer === server }", @connect="createConnection")

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
                button.red(type="button", @click="newconnection.color = 'red'", :class="{ active: newconnection.color === 'red' }") Red
                button.orange(type="button", @click="newconnection.color = 'orange'", :class="{ active: newconnection.color === 'orange' }") Orange
                button.yellow(type="button", @click="newconnection.color = 'yellow'", :class="{ active: newconnection.color === 'yellow' }") Yellow
                button.green(type="button", @click="newconnection.color = 'green'", :class="{ active: newconnection.color === 'green' }") Green
                button.blue(type="button", @click="newconnection.color = 'blue'", :class="{ active: newconnection.color === 'blue' }") Blue
                button.purple(type="button", @click="newconnection.color = 'purple'", :class="{ active: newconnection.color === 'purple' }") Purple

            hr

            .form-group
              input.form-control(placeholder="Host", v-model="newconnection.host", tabindex="2")
              input.form-control(placeholder="Username", v-model="newconnection.username", tabindex="3")
              input.form-control(type="password", placeholder="Password", v-model="newconnection.password", tabindex="4")
              input.form-control(type="number", placeholder="Port", v-model="newconnection.port", tabindex="5")

            .checkbox
              label
                input(type="checkbox", v-model="newconnection.useSSH", tabindex="6")
                =" Use SSH"

            .form-group(v-show="newconnection.useSSH")
              input.form-control(placeholder="SSH Host", v-model="newconnection.sshhost", tabindex="7")
              input.form-control(placeholder="SSH Username", v-model="newconnection.sshusername", tabindex="8")
              input.form-control(type="password", placeholder="SSH Password", v-model="newconnection.sshpassword", tabindex="9")
              input.form-control(type="number", placeholder="SSH Port", v-model="newconnection.sshport", tabindex="10")

            hr

            .btn-group.btn-group-justified
              .btn-group
                button.btn.btn-block.btn-lg.btn-danger(type="button", @click="selectServer(null)")
                  i.glyphicon.glyphicon-remove

              .btn-group(v-if="selectedServer")
                button.btn.btn-block.btn-lg.btn-primary(type="button", :disabled="!formFilled", @click="saveServer")
                  i.glyphicon.glyphicon-floppy-saved

              .btn-group(v-if="!selectedServer")
                button.btn.btn-block.btn-lg.btn-primary(type="button", :disabled="!formFilled", @click="saveServer")
                  i.glyphicon.glyphicon-plus

              .btn-group
                button.btn.btn-block.btn-lg.btn-success(:disabled="!formFilled")
                  i.glyphicon.glyphicon-ok
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

  import Connection from '../js/classes/Connection.js'
  import Server from '../js/classes/Server.js'

  import Config from '../js/classes/Config.js'

  export default {
    components: {
      servernav,
      servercontent,
      serveritem
    },

    data() {
      return {
        newconnection: {
          id: '',
          name: '',
          host: '',
          username: '',
          password: '',
          port: 3306,
          useSSH: false,
          sshhost: '',
          sshusername: '',
          sshpassword: '',
          sshport: 22,
          color: null,
          status: null
        },

        isConnecting: false,
        connectionError: ''
      }
    },

    computed: {
      ...mapState('server', {
        servers: 'items',
        selectedServer: 'selected',
      }),

      ...mapState('connection', {
        connections: 'items',
        selectedConnection: 'selected',
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
      this.initServer(Config.get('servers', []).map(server => new Server(server)))
    },

    watch: {
      selectedServer(newValue) {
        if (newValue === null) {
          return this.resetForm()
        }

        Object.keys(this.newconnection).map(key => {
          this.newconnection[key] = newValue.data[key]
        })
      }
    },

    methods: {
      ...mapMutations('server', {
        initServer: 'init',
        selectServer: 'select'
      }),

      ...mapMutations('connection', {
        selectConnection: 'select',
        addConnection: 'add',
        setConnectionStatus: 'setStatus'
      }),

      createConnection() {
        this.isConnecting = true
        this.connectionError = ''

        let connection = new Connection(this.newconnection)

        connection.connect()
          .then(() => {
            this.isConnecting = false

            this.addConnection(connection)
            this.selectConnection(connection)
            this.setConnectedStatus(connection)
            this.resetForm()
            this.selectServer(null)
          })
          .catch(res => {
            this.isConnecting = false
            this.connectionError = res.message
          })
      },

      resetForm() {
        this.newconnection.name = ''
        this.newconnection.host = ''
        this.newconnection.username = ''
        this.newconnection.password = ''
        this.newconnection.port = 3306
        this.newconnection.useSSH = false
        this.newconnection.sshhost = ''
        this.newconnection.sshusername = ''
        this.newconnection.sshpassword = ''
        this.newconnection.sshport = 22
        this.newconnection.color = null
        this.newconnection.id = ''
        this.newconnection.status = null
      },

      saveServer() {
        if (this.selectedServer === null) {
          let server = new Server(this.newconnection)

          this.$store.commit('server/add', server)

          this.resetForm()

          return
        }

        this.$store.commit('server/update', this.newconnection)
      }
    }
  }
</script>
