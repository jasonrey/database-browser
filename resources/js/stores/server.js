export default {
  namespaced: true,

  state: {
    items: [],
    selected: null
  },

  mutations: {
    init(state, servers) {
      state.items = servers
    },

    add(state, item) {
      state.items.push(item)

      Config.set('servers', state.items.map(item => item.data))
    },

    select(state, item) {
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
    delete({commit, state}, item) {
      if (item === state.selected) {
        commit('select', null)
      }

      commit('remove', item)
    }
  }
}
