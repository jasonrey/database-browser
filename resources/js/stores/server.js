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

      Config.set('servers', state.items.map(item => item.data))
    },

    set(state, item) {
      state.selected = item
    },

    update(state, item) {
      state.selected.update(item)

      Config.set('servers', state.items.map(item => item.data))
    },

    remove(state, item) {
      state.items.splice(state.items.indexOf(item), 1)

      Config.set('servers', state.items.map(item => item.data))
    }
  },

  actions: {
    delete({commit, state, dispatch}, item) {
      if (item === state.selected) {
        dispatch('select', null)
      }

      commit('remove', item)
    },

    select({commit}, item) {
      commit('set', item)

      if (item === null) {
        return commit('connection/resetForm', null, {root: true})
      }

      return commit('connection/setForm', item.data, {root: true})
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
