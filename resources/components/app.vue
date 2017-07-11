<template lang="pug">
    main.flex.flex-column
        ul#servers-tab-nav.nav.nav-tabs.flex-no-grow.flex-no-shrink
            servernav(v-for="(connection, index) in connections", :key="index", :connection="connection")

            li(:class="{ active: selectedConnection === null }", @click="selectConnection(null)")
                a(href="javascript:;")
                    i.glyphicon.glyphicon-plus
        #servers-tab-content.flex-grow
            servercontent(v-for="(connection, index) in connections", :key="index", :connection="connection")

            .active-only.abs.abs-full-size(:class="{ active: selectedConnection === null }")
</template>

<style lang="sass">
    main
        height: 100%
        overflow: hidden
</style>

<script>
    import { mapState, mapMutations } from 'vuex'
    import servernav from './servernav.vue'
    import servercontent from './servercontent.vue'

    export default {
        components: {
            servernav,
            servercontent
        },

        computed: {
            ...mapState([
                'connections',
                'selectedConnection'
            ])
        },

        methods: {
            ...mapMutations([
                'selectConnection'
            ])
        }
    }
</script>
