export default {
  namespaced: true,

  state: {
    items: []
  },

  mutations: {
    add(state, item) {
      item.date = new Date()

      state.items.push(item)
    },

    action(state, item) {
      item.type = 'action'
      item.date = new Date()

      state.items.push(item)
    },

    error(state, item) {
      item.type = 'error'
      item.date = new Date()

      state.items.push(item)
    },

    query(state, item) {
      item.type = 'query'
      item.date = new Date()

      state.items.push(item)
    }
  },

  getters: {
    errors(state) {
      return state.items.filter(item => item.type === 'error')
    },

    actions(state) {
      return state.items.filter(item => item.type === 'action')
    },

    queries(state) {
      return state.items.filter(item => item.type === 'query')
    },

    all(state) {
      return state.items
    }
  }
}
