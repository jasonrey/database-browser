import '../sass/index.sass';

import Vue from 'vue';
import Vuex from 'vuex';

import app from '../components/app.vue';
import modal from '../components/modal.vue';

const mysql = require('mysql')

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        connections: [],

        selectedConnection: null
    },
    mutations: {
        addConnection(state, connection) {
            state.connections.push(connection)
        },

        removeConnection(state, connection) {
            state.connections.splice(state.connections.indexOf(connection), 1)
        },

        selectConnection(state, connection) {
            state.selectedConnection = connection
        },

        setConnectionStatus(state, {connection, status}) {
            connection.status = status;
        }
    },

    actions: {
        createConnection({commit}, connection) {
            commit('addConnection', connection)
            commit('selectConnection', connection)

            const db = mysql.createConnection({
                host: connection.host,
                user: connection.username,
                password: connection.password,
                port: connection.port
            });

            db.connect(err => {
                console.log(err);

                if (err) {
                    return commit('setConnectionStatus', {connection, status: false});
                }

                connection.id = db.threadId;

                commit('setConnectionStatus', {connection, status: true});
            });
        },

        closeConnection({commit, state}, data) {
            let index = Math.max(0, state.connections.indexOf(data) - 1)

            commit('removeConnection', data)

            if (state.connections.length === 0) {
                return commit('selectConnection', null)
            }

            commit('selectConnection', state.connections[0])
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
