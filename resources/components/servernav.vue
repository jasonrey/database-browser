<template lang="pug">
    li(:class="{ active: connection === selectedConnection }", @click="selectConnection(connection)")
        a(href="javascript:;")
            .connection-status
            .inline-block {{ servername }}
</template>

<style lang="sass" scoped>
    .connection-status
        display: inline-block
        vertical-align: middle
        width: 6px
        height: 6px
        border-radius: 50%
        background-color: red
        margin: 0 4px 0 0

    h5
        margin: 0
        display: inline-block

</style>

<script>
    import { mapState, mapMutations } from 'vuex'

    export default {
        props: ['connection'],

        data() {
            return {
                servername: 'Home'
            }
        },

        computed: {
            ...mapState([
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
