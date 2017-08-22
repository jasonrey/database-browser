<template lang="pug">
  .active-only.active-flex.abs.abs-full-size
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
        @delete="deleteServer(server)"
      )

    .connection-form.flex-grow.flex.overflow-auto
      .col-sm-6.col-sm-offset-3.col-xs-12.text-center(v-show="isConnecting")
        p Connecting...
        .btn.btn-danger(@click="isConnecting = false") Cancel
      form.col-sm-6.col-sm-offset-3.col-xs-12(@submit.prevent="createConnection", v-show="!isConnecting")
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

    modal(:modal="modal")
</template>

<script>
import {mapState, mapActions} from 'vuex'

import modal from './modal.vue'
import serveritem from './serveritem.vue'

export default {
  components: {
    modal,
    serveritem
  },

  computed: {
    ...mapState('server', {
      servers: 'items',
      selectedServer: 'selected'
    }),

    ...mapState('connection', {
      connections: 'items',
      isConnecting: 'connecting',
      connectionError: 'error',
      newconnection: 'form'
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

  data() {
    return {
      modal: {
        show: false,
        type: '',
        title: '',
        content: '',
        cancel: null,
        ok: null
      }
    }
  },

  methods: {
    ...mapActions('connection', {
      createConnection: 'create'
    }),

    ...mapActions('server', {
      selectServer: 'select',
      saveServer: 'save'
    }),

    deleteServer(server) {
      this.modal.type = 'remove'
      this.modal.title = 'Delete Server'
      this.modal.content = 'Delete the server: ' + (server.name || server.host) + '?'

      this.modal.ok = async () => {
        const res = await this.$store.dispatch('server/delete', server)

        if (res === false) {
          this.modal.type = 'error'
          this.modal.title = 'Error'
          this.modal.content = 'Error deleting the server: ' + (server.name || server.host) + '. Close the connection and try again.'

          this.modal.show = true
        }
      }

      this.modal.show = true
    }
  }
}

</script>
