import 'bootstrap/dist/css/bootstrap.css';
import '../sass/index.sass';

import Vue from 'vue';
import Vuex from 'vuex';

import servercontent from '../components/servercontent.vue';

new Vue({
    el: '#app',
    components: {
        servercontent
    }
});
