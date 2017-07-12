<template lang="pug">
    main.flex.flex-column
        ul#servers-tab-nav.nav.nav-tabs.flex-no-grow.flex-no-shrink
            servernav(v-for="(connection, index) in connections", :key="index", :connection="connection")

            li(:class="{ active: selectedConnection === null }", @click="selectConnection(null)")
                a(href="javascript:;")
                    i.glyphicon.glyphicon-plus
        #servers-tab-content.flex-grow
            servercontent(v-for="(connection, index) in connections", :key="index", :connection="connection")

            .active-only.active-flex.abs.abs-full-size(:class="{ active: selectedConnection === null }")
                .sidebar.flex-no-shrink.overflow-auto
                    serveritem

                .connection-form.flex-grow.flex.overflow-auto
                    form.col-xs-6.col-xs-offset-3
                        .form-group
                            input.form-control(placeholder="Connection Name")

                        hr

                        .form-group
                            input.form-control(placeholder="Host")
                            input.form-control(placeholder="Username")
                            input.form-control(type="password", placeholder="Password")
                            input.form-control(type="number", placeholder="Port")

                        .checkbox
                            label
                                input(type="checkbox", v-model="useSSH")
                                =" Use SSH"

                        .form-group(v-show="useSSH")
                            input.form-control(placeholder="SSH Host")
                            input.form-control(placeholder="SSH Username")
                            input.form-control(type="password", placeholder="SSH Password")
                            input.form-control(type="number", placeholder="SSH Port")

                        hr

                        .btn-group.btn-group-justified
                            .btn-group
                                button.btn.btn-block.btn-lg.btn-danger(type="button")
                                    i.glyphicon.glyphicon-remove

                            .btn-group
                                button.btn.btn-block.btn-lg.btn-primary(type="button")
                                    i.glyphicon.glyphicon-plus

                            .btn-group
                                button.btn.btn-block.btn-lg.btn-success
                                    i.glyphicon.glyphicon-ok
</template>

<style lang="sass">
    main
        height: 100%
        overflow: hidden

    .connection-form
        align-items: center
        margin: 10px 0

        @media (max-height: 600px)
            align-items: initial
</style>

<script>
    import { mapState, mapMutations } from 'vuex'
    import servernav from './servernav.vue'
    import servercontent from './servercontent.vue'
    import serveritem from './serveritem.vue'

    export default {
        components: {
            servernav,
            servercontent,
            serveritem
        },

        data() {
            return {
                useSSH: false
            }
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
