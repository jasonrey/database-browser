<template lang="pug">
    main.flex.flex-column
        ul#servers-tab-nav.nav.nav-tabs.flex-no-grow.flex-no-shrink
            servernav.active
            servernav

            li
                a(href="javascript:;")
                    i.glyphicon.glyphicon-plus
        #servers-tab-content.flex-grow
            servercontent.active
            servercontent
</template>

<style lang="sass">
    main
        height: 100%
        overflow: hidden
</style>

<script>
    import servernav from './servernav.vue';
    import servercontent from './servercontent.vue';

    export default {
        components: {
            servernav,
            servercontent
        }
    }
</script>
