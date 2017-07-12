<template lang="pug">
    li(:class="{ active: connection === selectedConnection }")
        a(href="javascript:;", @click="selectConnection(connection)")
            .connection-status.inline-block
            .connection-name.inline-block {{ connection.name || connection.host }}

        button.btn.btn-link.btn-xs(@click="closeConnection(connection)")
            i.glyphicon.glyphicon-remove
</template>

<style lang="sass" scoped>
    .connection-status
        vertical-align: middle
        width: 6px
        height: 6px
        border-radius: 50%
        background-color: red

    .connection-name
        margin: 0 10px

    button
        position: absolute
        top: 50%
        right: 2px
        transform: translateY(-50%)
        display: none

    li
        &:hover
            button
                display: block
</style>

<script>
    import { mapState, mapMutations, mapActions } from 'vuex'

    export default {
        props: ['connection'],

        computed: {
            ...mapState([
                'selectedConnection'
            ])
        },

        methods: {
            ...mapMutations([
                'selectConnection'
            ]),

            ...mapActions([
                'closeConnection'
            ])
        }
    }
</script>
