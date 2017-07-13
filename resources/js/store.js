import Vuex from 'vuex'

import connection from './stores/connection.js'
import server from './stores/server.js'
import log from './stores/log.js'

export default {
  modules: {
    connection,
    server,
    log
  }
}
