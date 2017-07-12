import '../sass/index.sass';

import Vue from 'vue';
import Vuex from 'vuex';

import app from '../components/app.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        connections: [1],

        selectedConnection: null
    },
    mutations: {
        addConnection(state, connection) {
            state.connections.push(connection);
        },

        removeConnection(state, connection) {
            state.connections.splice(state.connections.indexOf(connection), 1);
        },

        selectConnection(state, connection) {
            state.selectedConnection = connection;
        }
    }
});

new Vue({
    store,
    el: '#app',
    components: {
        app
    }
});
