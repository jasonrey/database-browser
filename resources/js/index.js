import '../sass/index.sass'

import Vue from 'vue'
import Vuex from 'vuex'

import app from '../components/app.vue'
import modal from '../components/modal.vue'

import Server from './classes/Server.js'
import Config from './classes/Config.js'

import Store from './store.js'

Vue.config.devtools = true

Vue.use(Vuex)

window.store = new Vuex.Store(Store)

new Vue({
  store: store,
  el: '#app',
  components: {
    app,
    modal
  }
})
