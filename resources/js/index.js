import '../sass/index.sass'

import Vue from 'vue'
import Vuex from 'vuex'

import app from '../components/app.vue'
import modal from '../components/modal.vue'

import Server from './classes/Server.js'
import Config from './classes/Config.js'

Vue.config.devtools = true

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    connections: [],

    selectedConnection: null,

    servers: [],

    selectedServer: null
  },
  mutations: {
    addConnection(state, connection) {
      state.connections.push(connection)
    },

    removeConnection(state, connection) {
      state.connections.splice(state.connections.indexOf(connection), 1)
    },

    selectConnection(state, connection) {
      state.selectedConnection = connection
    },

    setConnectionStatus(state, {connection, status}) {
      connection.status = status
    },

    initServers(state, servers) {
      state.servers = Config.get('servers', []).map(server => new Server(server))
    },

    addServer(state, server) {
      state.servers.push(server)

      Config.set('servers', state.servers.map(server => server.data))
    },

    selectServer(state, server) {
      state.selectedServer = server
    },

    updateServer(state, server) {
      state.selectedServer.update(server)

      Config.set('servers', state.servers.map(server => server.data))
    },

    removeServer(state, server) {
      state.servers.splice(state.servers.indexOf(server), 1)

      Config.set('servers', state.servers.map(server => server.data))
    }
  },

  actions: {
    createConnection({commit}, connection) {
      commit('addConnection', connection)
      commit('selectConnection', connection)
      commit('setConnectionStatus', {connection, status: true})
    },

    closeConnection({commit, state}, connection) {
      connection.end()

      commit('removeConnection', connection)

      if (state.connections.length === 0) {
        return commit('selectConnection', null)
      }

      commit('selectConnection', state.connections[0])
    },

    deleteServer({commit, state}, server) {
      if (server === state.selectedServer) {
        commit('selectServer', null)
      }

      commit('removeServer', server)
    }
  }
})

new Vue({
  store,
  el: '#app',
  components: {
    app,
    modal
  }
})
