<template lang="pug">
    li(:class="{ active: connection === selectedConnection }", @click="selectConnection(connection)")
        a(href="javascript:;")
            .connection-status.inline-block
            .inline-block {{ servername }}
</template>

<style lang="sass" scoped>
    .connection-status
        vertical-align: middle
        width: 6px
        height: 6px
        border-radius: 50%
        background-color: red
        margin: 0 5px 0 0
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
