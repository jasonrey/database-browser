import 'bootstrap/dist/css/bootstrap.css';
import '../sass/index.sass';

import Vue from 'vue';

import servercontent from '../components/servercontent.vue';

new Vue({
    el: '#app',
    components: {
        servercontent
    }
});
