const moment = require('moment')

class Log {
  constructor(type, item) {
    this.type = type

    Object.keys(item).map(key => this[key] = item[key])

    this.hash = Date.now() + '-' + Math.random().toString().slice(2)
  }

  get date() {
    return moment(this.unix).format('YYYY-MM-DD HH:mm:ss')
  }

  get unix() {
    return parseInt(this.hash.split('.')[0])
  }
}

export default {
  namespaced: true,

  state: {
    items: []
  },

  mutations: {
    action(state, item) {
      state.items.push(new Log('action', item))
    },

    error(state, item) {
      state.items.push(new Log('error', item))
    },

    query(state, item) {
      state.items.push(new Log('query', item))
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
