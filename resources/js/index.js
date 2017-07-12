import '../sass/index.sass';

import Vue from 'vue';
import Vuex from 'vuex';

import app from '../components/app.vue';
import modal from '../components/modal.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        connections: [],

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
            console.log(connection);
            state.selectedConnection = connection;
        }
    },

    actions: {
        createConnection({commit}, data) {
            commit('addConnection', data);
            commit('selectConnection', data);
        },

        closeConnection({commit, state}, data) {
            let index = Math.max(0, state.connections.indexOf(data) - 1);

            commit('removeConnection', data);

            if (state.connections.length === 0) {
                commit('selectConnection', null);
                return;
            }

            commit('selectConnection', state.connections[0]);
        }
    }
});

new Vue({
    store,
    el: '#app',
    components: {
        app,
        modal
    }
});
