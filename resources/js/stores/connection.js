import Connection from '../classes/Connection.js'

export default {
  namespaced: true,

  state: {
    items: [],
    selected: null,
    connecting: false,
    error: '',

    form: {
      id: '',
      name: '',
      host: '',
      username: '',
      password: '',
      database: '',
      port: 3306,
      useSSH: false,
      sshhost: '',
      sshusername: '',
      sshpassword: '',
      sshport: 22,
      color: null,
      status: null
    }
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
    },

    resetForm(state) {
      state.form.name = ''
      state.form.host = ''
      state.form.username = ''
      state.form.password = ''
      state.form.database = ''
      state.form.port = 3306
      state.form.useSSH = false
      state.form.sshhost = ''
      state.form.sshusername = ''
      state.form.sshpassword = ''
      state.form.sshport = 22
      state.form.color = null
      state.form.id = ''
      state.form.status = null
    },

    setForm(state, data) {
      Object.keys(data).map(key => {
        state.form[key] = data[key]
      })
    },

    setConnecting(state, status) {
      state.connecting = status !== undefined ? status : true
    },

    clearError(state) {
      state.error = ''
    },

    setError(state, message) {
      state.error = message
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
    },

    create({commit, dispatch, state}) {
      commit('setConnecting')
      commit('clearError')

      let connection = new Connection(state.form)

      connection.connect()
        .then(() => {
          commit('setConnecting', false)

          commit('add', connection)
          commit('select', connection)
          commit('setConnectedStatus', connection)
          dispatch('server/select', null, {root: true})

        })
        .catch(res => {
          commit('setConnecting', false)
          commit('setError', res.message)
        })
    }
  }
}
