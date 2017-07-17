import Config from '../classes/Config.js'
import Server from '../classes/Server.js'

export default {
  namespaced: true,

  state: {
    items: [],
    selected: null
  },

  mutations: {
    init(state) {
      state.items = Config.get('servers', []).map(server => new Server(server))
    },

    add(state, item) {
      state.items.push(item)

      Config.set('servers', state.items)
    },

    set(state, item) {
      state.selected = item
    },

    update(state, item) {
      state.selected.update(item)

      Config.set('servers', state.items)
    },

    remove(state, item) {
      state.items.splice(state.items.indexOf(item), 1)

      Config.set('servers', state.items)
    }
  },

  actions: {
    delete({commit, state, dispatch, rootState}, item) {
      let found = false

      for (let i = 0; i < rootState.connection.items.length; i++) {
        if (rootState.connection.items[i].server.id === item.id) {
          found = true
          break;
        }
      }

      if (found) {
        return false
      }

      if (item === state.selected) {
        dispatch('select', null)
      }

      Config.set(item.id, null)

      commit('remove', item)
    },

    select({commit}, item) {
      commit('set', item)

      if (item === null) {
        return commit('connection/resetForm', null, {root: true})
      }

      return commit('connection/setForm', item, {root: true})
    },

    save({commit, state}, item) {
      if (state.selected === null) {
        let server = new Server(item)

        commit('add', server)

        commit('connection/resetForm', null, {root: true})

        return
      }

      commit('update', item)
    }
  }
}
