import Vuex from 'vuex'

import connection from './stores/connection.js'
import server from './stores/server.js'

export default {
  modules: {
    connection,
    server
  }
}
