export default {
  namespaced: true,

  state: {
    items: [],
    selected: null
  },

  mutations: {
    add(state, item) {
      state.items.push(item)
    },

    remove(state, item) {
      state.items.splice(state.items.indexOf(item), 1)
    },

    select(state, item) {
      state.selected = item
    },

    setStatus(state, {item, status}) {
      item.status = status
    },

    setConnectedStatus(state, item) {
      item.status = true
    }
  },

  actions: {
    close({commit, state}, item) {
      item.end()

      commit('remove', item)

      if (state.items.length === 0) {
        return commit('select', null)
      }

      commit('select', state.items[0])
    }
  }
}
